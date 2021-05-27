// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import assert from 'assert';
import path from 'path';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { camelCase, last } from 'lodash';
import { getLogger, setLevel } from '../utils/logger';
import { getYargsOption } from '../yargs';
import { IConfig, MinConfig, NodeConfig } from './NodeConfig';
import { SubqueryProject } from './project.model';

import { Pool } from 'pg';
import { QueryConfig } from './QueryConfig';

const YargsNameMapping = {
  local: 'localMode',
};

type Args = ReturnType<typeof getYargsOption>['argv'];

function yargsToIConfig(yargs: Args): Partial<IConfig> {
  return Object.entries(yargs).reduce((acc, [key, value]) => {
    if (['_', '$0'].includes(key)) return acc;
    acc[YargsNameMapping[key] ?? camelCase(key)] = value;
    return acc;
  }, {});
}

function defaultSubqueryName(config: Partial<IConfig>): MinConfig {
  return {
    ...config,
    subqueryName:
      config.subqueryName ??
      last(path.resolve(config.subquery).split(path.sep)),
  } as MinConfig;
}

const logger = getLogger('configure');

@Global()
@Module({})
export class ConfigureModule {
  static register(): DynamicModule {
    const yargsOptions = getYargsOption();
    const { argv } = yargsOptions;
    let config: NodeConfig;
    if (argv.config) {
      config = NodeConfig.fromFile(argv.config, yargsToIConfig(argv));
    } else {
      if (!argv.subquery) {
        logger.error(
          'subquery path is missing neither in cli options nor in config file',
        );
        yargsOptions.showHelp();
        process.exit(1);
      }
      assert(argv.subquery, 'subquery path is missing');
      config = new NodeConfig(defaultSubqueryName(yargsToIConfig(argv)));
    }

    if (config.debug) {
      setLevel('debug');
    }

    const projectPath = path.resolve(
      config.configDir && !argv.subquery ? config.configDir : '.',
      config.subquery,
    );

    const project = async () => {
      const p = await SubqueryProject.create(projectPath).catch((err) => {
        logger.error(err, 'Create Subquery project from given path failed!');
        process.exit(1);
      });

      if (config.networkEndpoint) {
        p.network.endpoint = config.networkEndpoint;
      }
      return p;
    };

    const qonfig = new QueryConfig({
      name: 'nftmart',
      playground: true,
    });

    const pgPool = new Pool({
      user: qonfig.get('DB_USER'),
      password: qonfig.get('DB_PASS'),
      host: qonfig.get('DB_HOST_READ') ?? qonfig.get('DB_HOST'),
      port: qonfig.get('DB_PORT'),
      database: qonfig.get('DB_DATABASE'),
    });
    pgPool.on('error', (err) => {
      // tslint:disable-next-line no-console
      getLogger('db').error('PostgreSQL client generated error: ', err.message);
    });

    return {
      module: ConfigureModule,
      providers: [
        {
          provide: NodeConfig,
          useValue: config,
        },
        {
          provide: SubqueryProject,
          useFactory: project,
        },
        {
          provide: QueryConfig,
          useValue: qonfig,
        },
        {
          provide: Pool,
          useValue: pgPool,
        },
      ],
      exports: [NodeConfig, SubqueryProject, QueryConfig, Pool],
    };
  }
}
