// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { NodeConfig } from '../configure/NodeConfig';
import { ProjectService } from './project.service';
import { ApolloServer } from 'apollo-server-express';
import { getPostGraphileBuilder } from 'postgraphile-core';
import { getLogger } from '../utils/logger';
import { plugins } from './plugins';

@Injectable()
export class ApolloService implements OnModuleInit {
  constructor(
    private readonly config: NodeConfig,
    private readonly pgPool: Pool,
    private readonly projectService: ProjectService,
  ) {}

  async onModuleInit(): Promise<void> {}

  async createServer(): Promise<ApolloServer> {
    const dbSchema = await this.projectService.getProjectSchema(
      this.config.subqueryName,
    );
    const builder = await getPostGraphileBuilder(
      this.pgPool,
      ['public', dbSchema],
      {
        replaceAllPlugins: plugins,
        subscriptions: true,
        dynamicJson: true,
      },
    );

    const schema = builder.buildSchema();
    const apolloServer = new ApolloServer({
      schema,
      context: ({ req }) => {
        return { pgClient: this.pgPool };
      },
      cacheControl: {
        defaultMaxAge: 5,
      },
      debug: process.env.NODE_ENV !== 'production',
      playground: this.config.playground,
      subscriptions: {
        path: '/subscription',
      },
    });

    return apolloServer;
  }
}
