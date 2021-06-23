// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { NodeConfig } from '../configure/NodeConfig';

@Injectable()
export class ProjectService {
  constructor(
    private readonly pool: Pool,
    private readonly config: NodeConfig,
  ) {}

  async onModuleInit(): Promise<void> {}

  async getProjectSchema(name: string): Promise<string> {
    const { rows } = await this.pool.query(
      `select *
       from ${DEFAULT_DB_SCHEMA}.subqueries
       where name = $1`,
      [name],
    );
    if (rows.length === 0) {
      throw new Error(`unknown project name ${this.config.subqueryName}. Have you started the node service?`);
    }
    return rows[0].db_schema;
  }
}

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';