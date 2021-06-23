// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DynamicModule, Global } from '@nestjs/common';
import { Sequelize } from 'sequelize';
// import { SequelizeAuto } from 'sequelize-auto';
import { Pool } from 'pg';
import { Options as SequelizeOption } from 'sequelize/types';
import * as entities from '../entities';
import { getLogger } from '../utils/logger';
import { delay } from '../utils/promise';
import { getYargsOption } from '../yargs';

export interface DbOption {
  host: string;
  port: number;
  schema: string;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

const logger = getLogger('db');

async function establishConnection(
  sequelize: Sequelize,
  numRetries: number,
): Promise<void> {
  try {
    await sequelize.authenticate();
  } catch (error) {
    logger.error(error, 'Unable to connect to the database');
    if (numRetries > 0) {
      await delay(3);
      void (await establishConnection(sequelize, numRetries - 1));
    } else {
      process.exit(1);
    }
  }
}

/*
const sequelizeAutoFactory = (option: SequelizeOption) => async () => {
  const sequelize = await sequelizeFactory({dialect: 'postgres', ...option})();
  const options = {
    caseFile: 'l',
    caseModel: 'p',
    caseProp: 'c',
  //schema: 'public',
  };
  const sequelizeAuto = new SequelizeAuto(sequelize, null, null, options);
  return sequelizeAuto;
}
*/

// var initialized: { [key: string]: boolean } = {};

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';

const sequelizeFactory = (option: SequelizeOption) => async () => {
  const sequelize = new Sequelize(option);
  const numRetries = 5;
  await establishConnection(sequelize, numRetries);
  let factoryFns = Object.keys(entities).filter((k) => /Factory$/.exec(k))
  for (const factoryFn of factoryFns) {
    /*
    if (!initialized[factoryFn]) {
      initialized[factoryFn] = true;
    }
    */
    console.log(factoryFn);
    entities[factoryFn](sequelize);
  }
  const { migrate } = getYargsOption().argv;
  const schemas = await sequelize.showAllSchemas(undefined);
  if (!((schemas as unknown) as string[]).includes(DEFAULT_DB_SCHEMA)) {
    await sequelize.createSchema(DEFAULT_DB_SCHEMA, undefined);
  }
  await sequelize.sync({ alter: migrate });
  return sequelize;
};

const poolFactory = (option: DbOption) => async () => {
  const pgPool = new Pool({
    user: option.username,
    password: option.password,
    host: option.host,
    port: option.port,
    database: option.database,
    ssl: option.ssl,
  });
  pgPool.on('error', (err) => {
    // tslint:disable-next-line no-console
    getLogger('db').error('PostgreSQL client generated error: ', err.message);
  });
  return pgPool;
};

@Global()
export class DbModule {
  static forRoot(option: DbOption): DynamicModule {
    const { argv } = getYargsOption();
    const logger = getLogger('db');
    return {
      module: DbModule,
      providers: [
        {
          provide: Sequelize,
          useFactory: sequelizeFactory({
            ...option,
            dialect: 'postgres',
            logging: argv.debug
              ? (sql: string, timing?: number) => {
                  logger.debug(sql);
                }
              : false,
          }),
        },
        {
          provide: Pool,
          useFactory: poolFactory(option),
        },
        /*
        {
          provide: SequelizeAuto,
          useFactory: sequelizeAutoFactory(option),
        }
        */
      ],
      exports: [
        Sequelize,
        Pool,
      //SequelizeAuto,
      ],
    };
  }

  static forFeature(models: string[]): DynamicModule {
    return {
      module: DbModule,
      providers: models.map((model) => ({
        provide: model,
        inject: [Sequelize],
        useFactory: (sequelize: Sequelize) => sequelize.model(model),
      })),
      exports: models,
    };
  }
}
