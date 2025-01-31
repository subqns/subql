// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigureModule } from './configure/configure.module';
import { DbModule } from './db/db.module';
import { IndexerModule } from './indexer/indexer.module';
import { MetaModule } from './meta/meta.module';
// import { GraphqlModule } from './graphql/graphql.module';
// import { RouterModule } from './router/router.module';
// import { CatModule } from './cat/cat.module';
// import { OrmCatModule } from './cat/orm/cat.module';
import { TypeOrmModule } from '@nestjs/typeorm';

// import { OffchainModules } from './offchain';
import { OnchainModule } from './onchain';
import { HealthModule } from './offchain/Health.module';

export class NodeOption {}

export const dbOptions = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'nftmart',
  database: process.env.DB_DATABASE ?? 'postgres',
  schema: process.env.DB_SCHEMA ?? 'public',
}

export const pgOptions = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'nftmart',
  database: process.env.DB_DATABASE ?? 'postgres',
  schema: process.env.DB_SCHEMA ?? 'public',
  ssl: !!process.env.DB_SSL,
}

@Module({
  imports: [
    DbModule.forRoot({
      ...dbOptions,
      ssl: !!process.env.DB_SSL,
    }),
    TypeOrmModule.forRoot({
      ...dbOptions,
      type: 'postgres',
      // entityPrefix: 'offchain_',
      autoLoadEntities: true,
      synchronize: true,
    }),
    EventEmitterModule.forRoot(),
    ConfigureModule.register(),
    ScheduleModule.forRoot(),
    IndexerModule,
    MetaModule,
    // GraphqlModule,
    // RouterModule,
    // CatModule,
    // OrmCatModule,
    // ...OffchainModules,
    OnchainModule,
    HealthModule,
  ],
  controllers: [],
})
export class AppModule {}
