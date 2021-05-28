// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IndexerManager } from './indexer/indexer.manager';
import { getLogger, NestLogger } from './utils/logger';
import { argv } from './yargs';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function bootstrap() {
  const debug = argv('debug');
  const app = await NestFactory.create(AppModule, {
    logger: debug ? new NestLogger() : false,
  });
  const indexerManager = app.get(IndexerManager);
  await indexerManager.start();
  await app.init();
  await app.listen(PORT);
  getLogger('subql-node').info(`node started on ${PORT}`);
}

void bootstrap();
