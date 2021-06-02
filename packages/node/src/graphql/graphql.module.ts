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
import { ApolloService } from './apollo.service';
import { useSofa } from 'sofa-api';
import express from 'express';

@Module({
  providers: [ProjectService, ApolloService],
  exports: [ApolloService],
})
export class GraphqlModule {}
