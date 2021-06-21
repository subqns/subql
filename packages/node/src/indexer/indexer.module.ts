// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ApiModule } from '../api/api.module';
import { BenchmarkService } from './benchmark.service';
import { FetchService } from './fetch.service';
import { IndexerManager } from './indexer.manager';
import { StoreService } from './store.service';

@Module({
  imports: [DbModule.forFeature(['Subquery']), ApiModule],
  providers: [
    IndexerManager,
    StoreService,
    FetchService,
    BenchmarkService,
  ],
  exports: [IndexerManager],
})
export class IndexerModule {}
