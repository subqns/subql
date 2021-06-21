// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { ApiService } from './api.service';

@Module({
  providers: [
    ApiService,
  ],
  exports: [ApiService],
})
export class ApiModule {}
