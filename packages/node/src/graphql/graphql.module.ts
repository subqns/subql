// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApolloServer } from 'apollo-server-express';
import ExpressPinoLogger from 'express-pino-logger';
import { Pool } from 'pg';
import { getPostGraphileBuilder } from 'postgraphile-core';
import { QueryConfig } from '../configure/QueryConfig';
import { getLogger } from '../utils/logger';
import { plugins } from './plugins';
import { ProjectService } from './project.service';
import { useSofa } from 'sofa-api';
import express from 'express';

@Module({
  providers: [ProjectService],
})
export class GraphqlModule implements OnModuleInit, OnModuleDestroy {
  private apolloServer: ApolloServer;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly config: QueryConfig,
    private readonly pgPool: Pool,
    private readonly projectService: ProjectService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.httpAdapterHost) {
      return;
    }
    this.apolloServer = await this.createServer();
  }

  async onModuleDestroy(): Promise<void> {
    return this.apolloServer?.stop();
  }

  private async createServer() {
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    const dbSchema = await this.projectService.getProjectSchema(
      this.config.get('name'),
    );
    const builder = await getPostGraphileBuilder(this.pgPool, [dbSchema], {
      replaceAllPlugins: plugins,
      subscriptions: true,
      dynamicJson: true,
    });

    const schema = builder.buildSchema();
    const server = new ApolloServer({
      schema,
      context: {
        pgClient: this.pgPool,
      },
      cacheControl: {
        defaultMaxAge: 5,
      },
      debug: this.config.get('NODE_ENV') !== 'production',
      playground: this.config.get('playground'),
      subscriptions: {
        path: '/subscription',
      },
    });

    // const port = process.env.PORT || 4000;
    // const appRest = express();
    //console.log('pre');

    //console.log(schema);

    //console.log('stringify');

    //console.log(JSON.stringify(schema, null, ' '));

    /*
    const sofaMiddleware = useSofa({
    //basePath: "/api",
    //context: { pgClient: this.pgPool },
      schema,
    });
    */

    //console.log('wtf');

    //appRest.use("/api", sofaMiddleware);
    /*
    appRest.use("/api", (req, res, next)=>{
      console.log(req.path);
      next();
    });
*/
    app.use(
      ExpressPinoLogger({
        logger: getLogger('express'),
        autoLogging: {
          ignorePaths: ['/.well-known/apollo/server-health'],
        },
      }),
    );

    server.applyMiddleware({
      app,
      path: '/',
      cors: true,
    });
    server.installSubscriptionHandlers(httpServer);

    return server;
  }
}
