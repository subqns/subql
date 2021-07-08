// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { Sequelize } from 'sequelize';
import { NodeConfig } from '../configure/NodeConfig';
import { ProjectService } from './project.service';
import { ApolloServer } from 'apollo-server-express';
import { getPostGraphileBuilder } from 'postgraphile-core';
import { getLogger } from '../utils/logger';
import { plugins } from './plugins';
import { postgraphile, createPostGraphileSchema } from 'postgraphile';
import { OpenAPI, useSofa } from 'sofa-api';
import swaggerUI from 'swagger-ui-express';
import { applyMiddleware } from 'graphql-middleware';
import { GraphQLSchema } from 'graphql';
import { buildSchema, defaultPlugins } from 'graphile-build';
import { printSchema } from 'graphql/utilities';
import { ApiService } from '../api/api.service';

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';

const logInput = async (resolve, root, args, context, info) => {
  console.log(`1. logInput: ${JSON.stringify(args)}`);
  const result = await resolve(root, args, context, info);
  console.log(`5. logInput`);
  return result;
};

const logResult = async (resolve, root, args, context, info) => {
  console.log(`2. logResult`);
  const result = await resolve(root, args, context, info);
  console.log(`4. logResult: ${JSON.stringify(result)}`);
  return result;
};

@Injectable()
export class ApolloService implements OnModuleInit {
  constructor(
    private readonly config: NodeConfig,
    private readonly pgPool: Pool,
    private readonly sequelize: Sequelize,
    private readonly projectService: ProjectService,
    private readonly apiService: ApiService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.apiService.init();
  }

  async createHandler() {
    const isProd = false;
    const isJwt = false;
    const jwtOptions = isJwt
      ? {
          jwtSecret: 'super_secret', // TODO: make configurable
          jwtPgTypeIdentifier: 'auth_public.jwt', // TODO: make configurable
          pgDefaultRole: 'auth_anonymous',
        }
      : {};
    const jwtSchemas = isJwt ? ['auth_public'] : [];
    const graphiqlOptions = isProd
      ? {}
      : {
          graphiqlRoute: '/',
          graphiql: true,
          allowExplain: true,
          enhanceGraphiql: true,
        };
    const dbSchema = await this.projectService.getProjectSchema(
      this.config.subqueryName,
    );
    return postgraphile(
      this.pgPool,
      [dbSchema, DEFAULT_DB_SCHEMA, ...jwtSchemas],
      {
        ...jwtOptions,
        ...graphiqlOptions,
        simpleCollections: 'both',
        graphqlRoute: '/graphql',
        retryOnInitFail: true,
        dynamicJson: true,
        bodySizeLimit: '5MB',
        enableCors: !isProd,
        replaceAllPlugins: plugins,
        subscriptions: true,
        exportGqlSchemaPath: 'schema.graphql',
        enableQueryBatching: true,
        sortExport: true,
        setofFunctionsContainNulls: false,
        graphileBuildOptions: {
          connectionFilterAllowNullInput: true,
          connectionFilterRelations: true,
          pgOmitListSuffix: false,
        },
        additionalGraphQLContextFromRequest: async (req, res) => {
          return {
            req,
            res,
            offchainSchema: DEFAULT_DB_SCHEMA,
            projectSchema: dbSchema,
            sequelize: this.sequelize,
            api: this.apiService.getApi(),
            keyring: this.apiService.getKeyring(),
          };
        },
      },
    );
  }

  async createApolloServer() {
    const dbSchema = await this.projectService.getProjectSchema(
      this.config.subqueryName,
    );

    const schema = await createPostGraphileSchema(
      this.pgPool,
      ['public', dbSchema],
      {
        replaceAllPlugins: plugins,
        subscriptions: true,
        dynamicJson: true,
      },
    );

    const schemaWithMiddleware: GraphQLSchema = schema; // applyMiddleware(schema, logInput, logResult);

    const apolloServer = new ApolloServer({
      schema: schemaWithMiddleware,
      context: ({ req }) => {
        return {
          projectSchema: dbSchema,
          pgClient: this.pgPool,
          sequelize: this.sequelize,
          api: this.apiService.getApi(),
          keyring: this.apiService.getKeyring(),
        };
      },
      /* if the isJwt is enabled , context.pgRole and context.jwtClaims would be set, for example:
      pgRole: 'auth_authenticated',
      jwtClaims: {
        role: 'auth_authenticated',
        user_id: 1,
        iat: 1623047184,
        exp: 1623133584,
        aud: 'postgraphile',
        iss: 'postgraphile'
      }
      */
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
        return {
          projectSchema: dbSchema,
          pgClient: this.pgPool,
          sequelize: this.sequelize,
          api: this.apiService.getApi(),
          keyring: this.apiService.getKeyring(),
        };
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
