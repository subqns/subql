// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiPromise, Keyring } from '@polkadot/api';
import {
  buildSchemaInlined,
  getAllEntitiesRelations,
  SubqlKind,
} from '@subquery/common';
import { QueryTypes, Sequelize } from 'sequelize';
import { NodeConfig } from '../configure/NodeConfig';
import { SubqueryProject } from '../configure/project.model';
import { getLogger } from '../utils/logger';
import * as SubstrateUtil from '../utils/substrate';
import { ApiService } from '../api/api.service';
import { IndexerEvent } from './events';
import { FetchService } from './fetch.service';
import { StoreService } from './store.service';
import { BlockContent } from './types';
import { handleBlock, handleCall, handleEvent } from '@nftmart/subql';
import { setGlobal } from '@subquery/types';
import { SubqnsService } from '../onchain/Subqns.service';
import { Subqns as SubqnsModel } from '../onchain/Subqns.entity';

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';

const logger = getLogger('index');

@Injectable()
export class IndexerManager implements OnModuleInit {
  private api: ApiPromise;
  private keyring: Keyring;
  private subqueryState: SubqnsModel;
  private prevSpecVersion?: number;
  private initialized: boolean;

  constructor(
    protected subqueryService: SubqnsService,
    protected apiService: ApiService,
    protected storeService: StoreService,
    protected fetchService: FetchService,
    protected sequelize: Sequelize,
    protected project: SubqueryProject,
    protected nodeConfig: NodeConfig,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.start();
  }

  async indexBlock({ block, events, extrinsics }: BlockContent): Promise<void> {
    const blockHeight = block.block.header.number.toNumber();
    const blockHash = block.block.header.hash.toString();
    logger.info(`index block ${blockHeight} ${blockHash}`);
    this.eventEmitter.emit(IndexerEvent.BlockProcessing, {
      height: blockHeight,
      timestamp: Date.now(),
    });

    try {
      const inject = block.specVersion !== this.prevSpecVersion;
      await this.apiService.setBlockhash(block.block.hash, inject);

      const dataSources = this.project.dataSources.filter(
        (ds) =>
          ds.startBlock <= block.block.header.number.toNumber() &&
          (!ds.filter?.specName ||
            ds.filter.specName === this.api.runtimeVersion.specName.toString()),
      );
      if (dataSources.length === 0) {
        logger.error(
          `Did not find any dataSource match with network specName ${this.api.runtimeVersion.specName}`,
        );
        process.exit(1);
      }

      for (const ds of dataSources) {
        if (ds.kind === SubqlKind.Runtime) {
          for (const handler of ds.mapping.handlers) {
            switch (handler.kind) {
              case SubqlKind.BlockHandler:
                if (SubstrateUtil.filterBlock(block, handler.filter)) {
                  handleBlock(block);
                }
                break;
              case SubqlKind.CallHandler: {
                const filteredExtrinsics = SubstrateUtil.filterExtrinsics(
                  extrinsics,
                  handler.filter,
                );
                for (const e of filteredExtrinsics) {
                  handleCall(e);
                }
                break;
              }
              case SubqlKind.EventHandler: {
                const filteredEvents = SubstrateUtil.filterEvents(
                  events,
                  handler.filter,
                );
                for (const e of filteredEvents) {
                  handleEvent(e);
                }
                break;
              }
              default:
            }
          }
        }
        // TODO: support Ink! and EVM
      }
      this.subqueryState.nextBlockHeight =
        block.block.header.number.toNumber() + 1;
      await this.subqueryService.save(this.subqueryState);
      this.fetchService.latestProcessed(block.block.header.number.toNumber());
      this.prevSpecVersion = block.specVersion;
    } catch (e) {
      throw e;
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.apiService.init();
    await this.fetchService.init();
    this.api = this.apiService.getApi();
    this.keyring = this.apiService.getKeyring();
    this.subqueryState = await this.ensureProject(this.nodeConfig.subqueryName);
    await this.initDbSchema();
    setGlobal({
      patchedApi: await this.apiService.getPatchedApi(),
      api: this.api,
      keyring: this.keyring,
      store: this.storeService.getStore(),
      logger: getLogger('nftmart'),
    });
    this.initialized = true;
  }

  async start(): Promise<void> {
    const latestBlock = await this.api.rpc.chain.getBlock();
    const latestBlockHeight = latestBlock.block.header.number.toNumber();
    const nextBlockHeight = this.subqueryState.nextBlockHeight;
    const followLatestBlock = this.nodeConfig.followLatestBlock;
    const startBlock = this.nodeConfig.startBlock;

    const blockHeight =
      startBlock != 0
        ? startBlock
        : followLatestBlock
        ? latestBlockHeight
        : nextBlockHeight;
    /*
    console.log(`latestBlockHeight: ${latestBlockHeight}`);
    console.log(`nextBlockHeight: ${nextBlockHeight}`);
    console.log(`followLatestBlock: ${followLatestBlock}`);
    console.log(`blockHeight: ${blockHeight}`);
    */
    void this.fetchService.startLoop(blockHeight).catch((err) => {
      logger.error(err, 'failed to fetch block');
      // FIXME: retry before exit
      process.exit(1);
    });
    this.fetchService.register((block) => this.indexBlock(block));
  }

  private getStartBlockFromDataSources() {
    const startBlocksList = this.project.dataSources
      .filter(
        (ds) =>
          !ds.filter?.specName ||
          ds.filter.specName === this.api.runtimeVersion.specName.toString(),
      )
      .map((item) => item.startBlock ?? 1);
    if (startBlocksList.length === 0) {
      logger.error(
        `Failed to find a valid datasource, Please check your endpoint if specName filter is used.`,
      );
      process.exit(1);
    } else {
      return Math.min(...startBlocksList);
    }
  }

  private async ensureProject(name: string): Promise<SubqnsModel> {
    let project = await this.subqueryService.findOne({ where: { name } });
    const { chain, genesisHash } = this.apiService.networkMeta;
    if (!project) {
      let projectSchema: string;
      if (this.nodeConfig.localMode) {
        // create tables in default schema if local mode is enabled
        projectSchema = DEFAULT_DB_SCHEMA;
      } else {
        projectSchema = `subquery_${name}`;
        const schemas = await this.sequelize.showAllSchemas(undefined);
        if (!(schemas as unknown as string[]).includes(projectSchema)) {
          await this.sequelize.createSchema(projectSchema, undefined);
        }
      }

      project = this.subqueryService.create({
        name,
        dbSchema: projectSchema,
        hash: '0x',
        nextBlockHeight: this.getStartBlockFromDataSources(),
        network: chain,
        networkGenesis: genesisHash,
      });
      await this.subqueryService.save(project);
    } else {
      if (!project.networkGenesis || !project.network) {
        project.network = chain;
        project.networkGenesis = genesisHash;
        // await project.save();
        await this.subqueryService.save(project);
      } else if (project.networkGenesis !== genesisHash) {
        logger.error(
          `Not same network: genesisHash different - ${project.networkGenesis} : ${genesisHash}`,
        );
        process.exit(1);
      }
    }
    return project;
  }

  private async initDbSchema(): Promise<void> {
    const dbSchema = this.subqueryState.dbSchema;
    const graphqlSchema = buildSchemaInlined(
      path.join(this.project.path, this.project.schema),
    );
    const modelsRelations = getAllEntitiesRelations(graphqlSchema);
    await this.storeService.initdbSchema(modelsRelations, dbSchema);
  }

  // deprecated
  private async nextSubquerySchemaSuffix(): Promise<number> {
    const seqExists = await this.sequelize.query(
      `SELECT 1
       FROM information_schema.sequences
       where sequence_schema = 'public'
         and sequence_name = 'subquery_schema_seq'`,
      {
        type: QueryTypes.SELECT,
      },
    );
    if (!seqExists.length) {
      await this.sequelize.query(
        `CREATE SEQUENCE subquery_schema_seq as integer START 1;`,
        { type: QueryTypes.RAW },
      );
    }
    const [{ nextval }] = await this.sequelize.query(
      `SELECT nextval('subquery_schema_seq')`,
      {
        type: QueryTypes.SELECT,
      },
    );
    return Number(nextval);
  }
}
