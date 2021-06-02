// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApolloServer } from 'apollo-server-express';
import ExpressPinoLogger from 'express-pino-logger';
import { ApolloService } from '../graphql/apollo.service';
import { getLogger } from '../utils/logger';
import { GraphqlModule } from '../graphql/graphql.module';

@Module({
  imports: [GraphqlModule],
})
export class RouterModule implements OnModuleInit, OnModuleDestroy {
  private apolloServer: ApolloServer;

  constructor(
    private readonly apolloService: ApolloService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.httpAdapterHost) {
      return;
    }
    this.apolloServer = await this.apolloService.createServer();
    await this.installServer();
  }

  async onModuleDestroy(): Promise<void> {
    return this.apolloServer?.stop();
  }

  async installServer(): Promise<void> {
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    app.use(
      ExpressPinoLogger({
        logger: getLogger('express'),
        autoLogging: {
          ignorePaths: ['/.well-known/apollo/server-health'],
        },
      }),
    );

    this.apolloServer.applyMiddleware({
      app,
      path: '/',
      cors: true,
    });
    this.apolloServer.installSubscriptionHandlers(httpServer);
  }
}
