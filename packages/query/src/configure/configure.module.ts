// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {DynamicModule, Global, Module} from '@nestjs/common';
import {Pool} from 'pg';
import {getLogger} from '../utils/logger';
import {getYargsOption} from '../yargs';
import {QueryConfig} from './config';

@Global()
@Module({})
export class ConfigureModule {
  static register(): DynamicModule {
    const {argv: opts} = getYargsOption();

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
          provide: QueryConfig,
          useValue: qonfig,
        },
        {
          provide: Pool,
          useValue: pgPool,
        },
      ],
      exports: [QueryConfig, Pool],
    };
  }
}
