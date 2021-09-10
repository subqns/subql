// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NestFactory } from '@nestjs/core';
import { AppModule, pgOptions } from './app.module';
import { AppNodeModule } from './app.node.module';
import { AppQueryModule } from './app.query.module';
import { IndexerManager } from './indexer/indexer.manager';
import { getLogger, NestLogger } from './utils/logger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Client } from 'pg';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const APP = process.env.APP || "all";

async function ensureSchema(){
  console.log(`ensure default schema ${pgOptions.schema} exists`);
  const client = new Client(pgOptions);
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${pgOptions.schema}`);
  await client.end();
}

async function bootstrapNode() {
  const app = await NestFactory.create(AppNodeModule);
  await app.get(IndexerManager).init();
  await app.init();
  getLogger('subql-node').info(`subql-node started`);
}

async function bootstrapQuery() {
  const app = await NestFactory.create(AppQueryModule);
  // await app.get('InitSchema')();
  await app.init();
  await app.listen(PORT);
  getLogger('subql-query').info(`subql-query started on ${PORT}`);
}

async function bootstrapAll() {
  await ensureSchema();

  const appOptions = {cors: true}
  const app = await NestFactory.create(AppModule, appOptions);
  // await app.get('InitSchema')();
  await app.get(IndexerManager).init();

  const docOpts = new DocumentBuilder()
    .setTitle('Nftmart Cache Service')
    .setDescription('Query onchain and offchain data with ease')
    .setVersion('1.0')
    .setBasePath('api')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, docOpts);
  SwaggerModule.setup('/docs', app, document);

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
