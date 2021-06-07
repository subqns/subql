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
import { postgraphile, createPostGraphileSchema } from 'postgraphile';
import { OpenAPI, useSofa } from 'sofa-api';
import { buildSchema } from '@subql/common';
import swaggerUI from 'swagger-ui-express';

@Injectable()
export class ApolloService implements OnModuleInit {
  constructor(
    private readonly config: NodeConfig,
    private readonly pgPool: Pool,
    private readonly projectService: ProjectService,
  ) {}

  async onModuleInit(): Promise<void> {}

  async createHandler() {
    const isProd = false;
    const dbSchema = await this.projectService.getProjectSchema(
      this.config.subqueryName,
    );
    return postgraphile(
      this.pgPool,
      ['auth_public', 'public', dbSchema],
      //['public', dbSchema],
      {
        retryOnInitFail: true,
        dynamicJson: true,
        bodySizeLimit: '5MB',
        // pgDefaultRole: DB_DEFAULT_ROLE,
        graphiql: !isProd,
        allowExplain: !isProd,
        enableCors: !isProd,
        replaceAllPlugins: plugins,
        subscriptions: true,
        jwtSecret: 'super_secret',
        jwtPgTypeIdentifier: 'auth_public.jwt',
        // appendPlugins: [FilterPlugin, PgSimplifyInflectorPlugin],
        // skipPlugins: [],
        enhanceGraphiql: true,
        exportGqlSchemaPath: 'schema.graphql',
        enableQueryBatching: true,
        sortExport: true,
        setofFunctionsContainNulls: false,
        graphileBuildOptions: {
          connectionFilterAllowNullInput: true,
          connectionFilterRelations: true,
        },
      },
    );
  }

  async createSwagger() {
    const graphqlSchema = buildSchema('schema.graphql');
    // console.log(graphqlSchema);
    const openApi = OpenAPI({
      schema: graphqlSchema,
      info: {
        title: 'Example API',
        version: '3.0.0',
      },
    });
    const options = { explorer: true };
    return [swaggerUI.serve, swaggerUI.setup(openApi.get(), options)];
  }

  async createServer(): Promise<ApolloServer> {
    const dbSchema = await this.projectService.getProjectSchema(
      this.config.subqueryName,
    );
    await this.createHandler();
    /*
    const builder = await getPostGraphileBuilder(
      this.pgPool,
      ['public', dbSchema],
      {
        replaceAllPlugins: plugins,
        subscriptions: true,
        dynamicJson: true,
        // exportGqlSchemaPath: 'schema.graphql',
        // jwtSecret: process.env.JWT_SECRET,
        // jwtPgTypeIdentifier: `${process.env.POSTGRAPHILE_SCHEMA}.jwt`,
      },
    );

    const schema = builder.buildSchema();
    */
    const schema = await createPostGraphileSchema(
      this.pgPool,
      ['public', dbSchema],
      {
        replaceAllPlugins: plugins,
        subscriptions: true,
        dynamicJson: true,
        // exportGqlSchemaPath: 'schema.graphql',
        // jwtSecret: process.env.JWT_SECRET,
        // jwtPgTypeIdentifier: `${process.env.POSTGRAPHILE_SCHEMA}.jwt`,
      },
    );
    //console.log('before')

    /*
    const sofaMiddleware = useSofa({
      basePath: "/api",
      schema: graphqlSchema,
      context: { db: this.pgPool },
    });
    */
    //console.log('after')

    const apolloServer = new ApolloServer({
      schema,
      context: ({ req }) => {
        console.log(JSON.stringify(req.headers, null, '  '));
        console.log(req.method);
        console.log(req.body);
        // req.res.write();
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
