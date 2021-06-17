// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppNodeModule } from './app.node.module';
import { AppQueryModule } from './app.query.module';
import { IndexerManager } from './indexer/indexer.manager';
import { getLogger, NestLogger } from './utils/logger';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const APP = process.env.APP || "all";

async function bootstrapNode() {
  const app = await NestFactory.create(AppNodeModule);
  await app.get(IndexerManager).init();
  await app.init();
  getLogger('subql-node').info(`subql-node started`);
}

async function bootstrapQuery() {
  const app = await NestFactory.create(AppQueryModule);
  await app.init();
  await app.listen(PORT);
  getLogger('subql-query').info(`subql-query started on ${PORT}`);
}

async function bootstrapAll() {
  const app = await NestFactory.create(AppModule);
  await app.get(IndexerManager).init();
  await app.init();
  await app.listen(PORT);
  getLogger('subql').info(`subql started on ${PORT}`);
}

switch (APP) {
  case 'node':
    void bootstrapNode();
    break;
  case 'query':
    void bootstrapQuery();
    break;
  default:
    void bootstrapAll();
}