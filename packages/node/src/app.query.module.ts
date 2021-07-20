// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { ConfigureModule } from './configure/configure.module';
import { DbModule } from './db/db.module';
import { GraphqlModule } from './graphql/graphql.module';
import { RouterModule } from './router/router.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IndexerModule } from './indexer/indexer.module';
import { MetaModule } from './meta/meta.module';
import { ApiModule } from './api/api.module';
// import { CatModule } from './cat/cat.module';
// import { OrmCatModule } from './cat/orm/cat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatModule } from './offchain/Cat.module';

export class NodeOption {}

@Module({
  imports: [
    DbModule.forRoot({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'nftmart',
      database: process.env.DB_DATABASE ?? 'postgres',
      schema: process.env.DB_SCHEMA ?? 'public',
      ssl: !!process.env.DB_SSL,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'nftmart',
      database: process.env.DB_DATABASE ?? 'postgres',
      schema: process.env.DB_SCHEMA ?? 'public',
      entityPrefix: 'offchain_',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ConfigureModule.register(),
    EventEmitterModule.forRoot(),
    GraphqlModule,
    RouterModule,
    ApiModule,
    // CatModule,
    // OrmCatModule,
    CatModule,
  ],
  controllers: [],
})
export class AppQueryModule {}
