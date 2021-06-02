// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { QueryConfig } from '../configure/QueryConfig';
import { ProjectService } from './project.service';
import { ApolloServer } from 'apollo-server-express';
import { getPostGraphileBuilder } from 'postgraphile-core';
import { getLogger } from '../utils/logger';
import { plugins } from './plugins';

@Injectable()
export class ApolloService {
  constructor(
    private readonly config: QueryConfig,
    private readonly pgPool: Pool,
    private readonly projectService: ProjectService,
  ) {}

  async createServer(): Promise<ApolloServer> {
    const dbSchema = await this.projectService.getProjectSchema(
      this.config.get('name'),
    );
    const builder = await getPostGraphileBuilder(this.pgPool, [dbSchema], {
      replaceAllPlugins: plugins,
      subscriptions: true,
      dynamicJson: true,
    });

    const schema = builder.buildSchema();
    const apolloServer = new ApolloServer({
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

    return apolloServer;
  }
}
