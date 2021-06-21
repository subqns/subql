// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ApolloService } from './apollo.service';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [ApiModule],
  providers: [ProjectService, ApolloService],
  exports: [ApolloService],
})
export class GraphqlModule {}
