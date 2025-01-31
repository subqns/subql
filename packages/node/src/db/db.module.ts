// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DynamicModule, Global } from '@nestjs/common';
import { Sequelize } from 'sequelize';
// import { SequelizeAuto } from 'sequelize-auto';
import { Pool, Client } from 'pg';
import { createConnection, Connection as TypeOrm } from 'typeorm';
import { Options as SequelizeOption } from 'sequelize/types';
import { getLogger } from '../utils/logger';
import { delay } from '../utils/promise';
import { getYargsOption } from '../yargs';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { OrmCat } from '../cat/orm/cat.entity';

export interface DbOption {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  ssl?: boolean;
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

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';
const { migrate } = getYargsOption().argv;

const sequelizeFactory = (option: SequelizeOption) => async () => {
  const sequelize = new Sequelize(option);
  const numRetries = 5;
  await establishConnection(sequelize, numRetries);

  const schemas = await sequelize.showAllSchemas(undefined);
  if (!(schemas as unknown as string[]).includes(DEFAULT_DB_SCHEMA)) {
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

/*
const typeormFactory = (option: DbOption) => async () => {
  const typeorm: TypeOrm = await createConnection({
    ...option,
    type: 'postgres',
    // autoLoadEntities: true,
    entities: [
      OrmCat,
    ],
    synchronize: migrate,
    extra: {
      poolSize: 10,
    },
    logging: false,
  });
  return typeorm;
};
*/

@Global()
export class DbModule {
  static forRoot(option: DbOption): DynamicModule {
    const { argv } = getYargsOption();
    const logger = getLogger('db');
    // await ensureDefaultSchema(option);
    return {
      module: DbModule,
      /*
      imports: [
        TypeOrmModule.forRoot({
          ...option,
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: migrate,
        }),
      ],
      */
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
          provide: TypeOrm,
          useFactory: typeormFactory(option),
        },
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
        //TypeOrm,
      ],
    };
  }
}
