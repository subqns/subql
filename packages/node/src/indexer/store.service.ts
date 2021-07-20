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

  // this part runs after typeorm tables are created / modified
  // it's suitable for defining functions / views that need to access both schemas
  async syncoffchain(dbSchema: string): Promise<void> {
    let offchainSchema = process.env.DB_SCHEMA ?? 'public';
    let extraQueries = [
      // populate data, note that updated_at isn't updated unless row is changed via typeorm
      // can also be done in Account.service's onModuleInit stage
      `INSERT INTO ${offchainSchema}.offchain_account (id, name) VALUES
        ('65ADzWZUAKXQGZVhQ7ebqRdqEzMEftKytB8a7rknW82EASXB', 'alice') ON CONFLICT DO NOTHING`,
      `UPDATE ${offchainSchema}.offchain_account SET alias = 'alice_alias' WHERE id = '65ADzWZUAKXQGZVhQ7ebqRdqEzMEftKytB8a7rknW82EASXB'`,

      // create computed column accounts.name, see https://www.graphile.org/postgraphile/computed-columns/
      `CREATE OR REPLACE FUNCTION ${dbSchema}.accounts_name(acc ${dbSchema}.accounts) RETURNS text AS $$
        SELECT name FROM ${offchainSchema}.offchain_account WHERE id = acc.id
        $$ LANGUAGE sql STABLE;`,
    ];

    if (false) {
      extraQueries = extraQueries.concat([
	`DROP VIEW IF EXISTS public.orders`,
	`DROP VIEW IF EXISTS public.order_items`,
	`DROP VIEW IF EXISTS public.classes`,
	`DROP VIEW IF EXISTS public.categories`,
	`DROP VIEW IF EXISTS public.nfts`,
	`DROP VIEW IF EXISTS public.accounts`,
	`CREATE OR REPLACE VIEW public.orders AS SELECT * FROM ${dbSchema}.orders`,
	`CREATE OR REPLACE VIEW public.order_items AS SELECT * FROM ${dbSchema}.order_items`,
	`CREATE OR REPLACE VIEW public.classes AS SELECT * FROM ${dbSchema}.classes`,
	`CREATE OR REPLACE VIEW public.categories AS SELECT * FROM ${dbSchema}.categories`,
	`CREATE OR REPLACE VIEW public.nfts AS SELECT * FROM ${dbSchema}.nfts`,
	`CREATE OR REPLACE VIEW public.accounts AS SELECT * FROM ${dbSchema}.accounts`,
      ])
    }

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
        timestamps: false,
      });
    }
    // console.log(this.sequelize.models);
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
