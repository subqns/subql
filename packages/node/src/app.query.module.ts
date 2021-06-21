// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { ConfigureModule } from './configure/configure.module';
import { DbModule } from './db/db.module';
import { GraphqlModule } from './graphql/graphql.module';
import { RouterModule } from './router/router.module';

export class NodeOption {}

@Module({
  imports: [
    DbModule.forRoot({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'postgres',
      ssl: !!process.env.DB_SSL,
    }),
    ConfigureModule.register(),
    GraphqlModule,
    RouterModule,
  ],
  controllers: [],
})
export class AppQueryModule {}
