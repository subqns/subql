// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  Module,
  OnModuleDestroy,
  OnModuleInit,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApolloServer } from 'apollo-server-express';
import ExpressPinoLogger from 'express-pino-logger';
import { ApolloService } from '../graphql/apollo.service';
import { getLogger } from '../utils/logger';
import { GraphqlModule } from '../graphql/graphql.module';
import express from 'express';

@Module({
  imports: [GraphqlModule],
})
export class RouterModule
  implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap {
  private apolloHandler: any;
  private apolloServer: ApolloServer;

  constructor(
    private readonly apolloService: ApolloService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async onApplicationBootstrap(): Promise<void> {}

  async onModuleInit(): Promise<void> {
    if (!this.httpAdapterHost) {
      return;
    }
    this.apolloHandler = await this.apolloService.createHandler();
    // this.apolloServer = await this.apolloService.createApolloServer();
    await this.setupRouter();
  }

  async onModuleDestroy(): Promise<void> {}

  async setupRouter(): Promise<void> {
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    app.use(this.apolloHandler);
    express.static.mime.define({ 'text/plain': ['graphql'] });
    app.use('/schema.graphql', express.static('schema.graphql'));
    return;
    this.apolloServer.applyMiddleware({
      app,
      path: '/apollo',
      cors: true,
    });
  }
}
