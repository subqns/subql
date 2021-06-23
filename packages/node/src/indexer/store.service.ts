// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import assert from 'assert';
import { Injectable } from '@nestjs/common';
import { GraphQLModelsRelations } from '@subql/common/graphql/types';
import { Entity, Store } from '@subql/types';
import { flatten, camelCase } from 'lodash';
import { QueryTypes, Sequelize, Transaction, Utils } from 'sequelize';
import { NodeConfig } from '../configure/NodeConfig';
import { modelsTypeToModelAttributes } from '../utils/graphql';
import { getLogger } from '../utils/logger';
import { camelCaseObjectKey } from '../utils/object';
import {
  commentConstraintQuery,
  createUniqueIndexQuery,
  getFkConstraint,
  smartTags,
} from '../utils/sync-helper';

const logger = getLogger('store');

interface IndexField {
  entityName: string;
  fieldName: string;
  isUnique: boolean;
  type: string;
}

@Injectable()
export class StoreService {
  private tx?: Transaction;
  private modelIndexedFields: IndexField[];
  private dbSchema: string;
  private modelsRelations: GraphQLModelsRelations;

  constructor(private sequelize: Sequelize, private config: NodeConfig) {}

  async initdbSchema(
    modelsRelations: GraphQLModelsRelations,
    dbSchema: string,
  ): Promise<void> {
    this.dbSchema = dbSchema;
    this.modelsRelations = modelsRelations;
    try {
      await this.syncdbSchema(this.dbSchema);
      await this.syncoffchain(this.dbSchema);
    } catch (e) {
      logger.error(e, `Having a problem when syncing dbSchema`);
      process.exit(1);
    }
    try {
      this.modelIndexedFields = await this.getAllIndexFields(this.dbSchema);
    } catch (e) {
      logger.error(e, `Having a problem when get indexed fields`);
      process.exit(1);
    }
  }

  async syncoffchain(dbSchema: string): Promise<void> {
    let offchainSchema = process.env.DB_SCHEMA ?? 'public';
    const extraQueries = [

      /* common setup */

      `CREATE EXTENSION IF NOT EXISTS pgcrypto`, // provides gen_random_uuid()

      // `CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA pg_catalog`, // provides gen_random_uuid()

      // `CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA ${offchainSchema}`, // provides gen_random_uuid()

      // `CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA ${offchainSchema}`, // provides gen_random_uuid()

      `CREATE SCHEMA IF NOT EXISTS ${offchainSchema}`,


      `CREATE OR REPLACE FUNCTION ${offchainSchema}.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql'`,

      /* ======= offchain_accounts ======== */

      `CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_accounts (
        "id" text NOT NULL PRIMARY KEY,
        "balance" bigint,
        "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
        "updated_at" timestamptz NOT NULL DEFAULT current_timestamp
      );`,

      /* CREATE OR REPLACE TRIGGER is not supported until pg14 */
      `DROP TRIGGER IF EXISTS offchain_accounts_updated_at ON ${offchainSchema}.offchain_accounts`,
      `CREATE TRIGGER offchain_accounts_updated_at BEFORE UPDATE ON ${offchainSchema}.offchain_accounts
        FOR EACH ROW EXECUTE PROCEDURE ${offchainSchema}.update_updated_at_column();`,


      `INSERT INTO ${offchainSchema}.offchain_accounts (id, balance) VALUES
        ('65ADzWZUAKXQGZVhQ7ebqRdqEzMEftKytB8a7rknW82EASXB', 10000) ON CONFLICT DO NOTHING`,

      /* left join tables from two schemas */
      `CREATE OR REPLACE VIEW ${dbSchema}.accountBalances AS
        SELECT ${dbSchema}.accounts.id, ${offchainSchema}.offchain_accounts.balance
        FROM ${dbSchema}.accounts LEFT JOIN ${offchainSchema}.offchain_accounts
        ON ${dbSchema}.accounts.id = ${offchainSchema}.offchain_accounts.id
      `,

      /* ======= offchain_nft_views =======  */

      `CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_nft_views (
          id bigserial PRIMARY KEY,
          viewer_id text NOT NULL,
          nft_id text NOT NULL,
          count INTEGER DEFAULT 1 CHECK (count > 0),
          "timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP
        )
      `,
      `CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_class_views (
        id bigserial PRIMARY KEY,
        viewer_id text NOT NULL,
        class_id text NOT NULL,
        count INTEGER DEFAULT 1 CHECK (count > 0),
        "timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP
      )
    `,
      // select sum(count) as total from offchain.offchain_nft_views where nft_id = 'wtf';
      `CREATE INDEX IF NOT EXISTS offchain_nft_views_viewer ON ${offchainSchema}.offchain_nft_views USING btree(viewer_id);`,
      `CREATE INDEX IF NOT EXISTS offchain_nft_views_nft ON ${offchainSchema}.offchain_nft_views USING btree(nft_id);`,
      // `ALTER TABLE ONLY ${offchainSchema}.offchain_nft_views ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 1 CHECK (count > 0)`,

      /* ======== offchain_account ======== */
      /* ======== offchain_class_views ======== */
      /* ======== cat ======= */
      `CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_cats (
        id SERIAL NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        age SMALLINT NOT NULL,
        breed TEXT
      )`,
      `ALTER TABLE ONLY ${offchainSchema}.offchain_cats ALTER COLUMN breed SET DEFAULT 'unknown'`,
    ];

    /*
    let allQuery = extraQueries.map(q=>q.trim().replace(/[;]+$/, "")).join(";\n");
    await this.sequelize.query(allQuery);
    console.log(allQuery);
    return
    */

    for (const query of extraQueries) {
      console.log(query);
      await this.sequelize.query(query);
    }
  }

  async syncdbSchema(dbSchema: string): Promise<void> {
    for (const model of this.modelsRelations.models) {
      const attributes = modelsTypeToModelAttributes(model);
      const indexes = model.indexes.map(({ fields, unique, using }) => ({
        fields: fields.map((field) => Utils.underscoredIf(field, true)),
        unique,
        using,
      }));
      if (indexes.length > this.config.indexCountLimit) {
        throw new Error(`too many indexes on entity ${model.name}`);
      }

      this.sequelize.define(model.name, attributes, {
        underscored: true,
        freezeTableName: false,
        schema: dbSchema,
        indexes,
        timestamps: true,
      });

      if (model.name == 'NftView' || model.name == 'Block') {
        console.log(model.name, attributes, {
          underscored: true,
          freezeTableName: false,
          schema: dbSchema,
          indexes,
          timestamps: true,
        });
      }
    }
    console.log(this.sequelize.models);
    const extraQueries = [];
    for (const relation of this.modelsRelations.relations) {
      const model = this.sequelize.model(relation.from);
      const relatedModel = this.sequelize.model(relation.to);
      switch (relation.type) {
        case 'belongsTo': {
          model.belongsTo(relatedModel, { foreignKey: relation.foreignKey });
          break;
        }
        case 'hasOne': {
          const rel = model.hasOne(relatedModel, {
            foreignKey: relation.foreignKey,
          });
          const fkConstraint = getFkConstraint(
            rel.target.tableName,
            rel.foreignKey,
          );
          const tags = smartTags({
            singleForeignFieldName: relation.fieldName,
          });
          extraQueries.push(
            commentConstraintQuery(
              `${dbSchema}.${rel.target.tableName}`,
              fkConstraint,
              tags,
            ),
            createUniqueIndexQuery(
              dbSchema,
              relatedModel.tableName,
              relation.foreignKey,
            ),
          );
          break;
        }
        case 'hasMany': {
          const rel = model.hasMany(relatedModel, {
            foreignKey: relation.foreignKey,
          });
          const fkConstraint = getFkConstraint(
            rel.target.tableName,
            rel.foreignKey,
          );
          const tags = smartTags({
            foreignFieldName: relation.fieldName,
          });
          extraQueries.push(
            commentConstraintQuery(
              `${dbSchema}.${rel.target.tableName}`,
              fkConstraint,
              tags,
            ),
          );

          break;
        }
        default:
          throw new Error('Relation type is not supported');
      }
    }
    await this.sequelize.sync({
      // logging: console.log,
    });
    for (const query of extraQueries) {
      console.log(query);
      await this.sequelize.query(query);
    }
  }

  private async getAllIndexFields(dbSchema: string) {
    const fields: IndexField[][] = [];
    for (const entity of this.modelsRelations.models) {
      const model = this.sequelize.model(entity.name);
      const tableFields = await this.packEntityFields(
        dbSchema,
        entity.name,
        model.tableName,
      );
      fields.push(tableFields);
    }
    return flatten(fields);
  }

  private async packEntityFields(
    dbSchema: string,
    entity: string,
    table: string,
  ): Promise<IndexField[]> {
    const rows = await this.sequelize.query(
      `select
    '${entity}' as entity_name,
    a.attname as field_name,
    idx.indisunique as is_unique,
    am.amname as type
from
    pg_index idx
    JOIN pg_class cls ON cls.oid=idx.indexrelid
    JOIN pg_class tab ON tab.oid=idx.indrelid
    JOIN pg_am am ON am.oid=cls.relam,
    pg_namespace n,
    pg_attribute a
where
  n.nspname = '${dbSchema}'
  and tab.relname = '${table}'
  and a.attrelid = tab.oid
  and a.attnum = ANY(idx.indkey)
  and not idx.indisprimary
group by
    n.nspname,
    a.attname,
    tab.relname,
    idx.indisunique,
    am.amname`,
      {
        type: QueryTypes.SELECT,
      },
    );
    const results = rows;
    return results.map((result) => camelCaseObjectKey(result)) as IndexField[];
  }

  getStore(): Store {
    return {
      get: async (entity: string, id: string): Promise<Entity | undefined> => {
        const model = this.sequelize.model(entity);
        assert(model, `model ${entity} not exists`);
        const record = await model.findOne({
          where: { id },
          transaction: this.tx,
        });
        return record?.toJSON() as Entity;
      },
      getByField: async (
        entity: string,
        field: string,
        value,
      ): Promise<Entity[] | undefined> => {
        const model = this.sequelize.model(entity);
        assert(model, `model ${entity} not exists`);
        const indexed =
          this.modelIndexedFields.findIndex(
            (indexField) =>
              indexField.entityName === entity &&
              indexField.fieldName === field,
          ) > -1;
        assert(
          indexed,
          `to query by field ${field}, an index must be created on model ${entity}`,
        );
        const records = await model.findAll({
          where: { [field]: value },
          transaction: this.tx,
          limit: this.config.queryLimit,
        });
        return records.map((record) => record.toJSON() as Entity);
      },
      getOneByField: async (
        entity: string,
        field: string,
        value,
      ): Promise<Entity | undefined> => {
        const model = this.sequelize.model(entity);
        assert(model, `model ${entity} not exists`);
        const indexed =
          this.modelIndexedFields.findIndex(
            (indexField) =>
              indexField.entityName === entity &&
              indexField.fieldName === field &&
              indexField.isUnique,
          ) > -1;
        assert(
          indexed,
          `to query by field ${field}, an unique index must be created on model ${entity}`,
        );
        const record = await model.findOne({
          where: { [field]: value },
          transaction: this.tx,
        });
        return record?.toJSON() as Entity;
      },
      set: async (entity: string, id: string, data: Entity): Promise<void> => {
        const model = this.sequelize.model(entity);
        assert(model, `model ${entity} not exists`);
        await model.upsert(data, { transaction: this.tx });
      },
      remove: async (entity: string, id: string): Promise<void> => {
        const model = this.sequelize.model(entity);
        assert(model, `model ${entity} not exists`);
        await model.destroy({ where: { id }, transaction: this.tx });
      },
    };
  }
}
