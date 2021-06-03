// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { NodeConfig } from '../configure/NodeConfig';
import { IndexerManager } from '../indexer/indexer.manager';

@Injectable()
export class ProjectService {
  constructor(
    private readonly pool: Pool,
    private readonly config: NodeConfig,
    private readonly indexerManager: IndexerManager,
  ) {}

  async getProjectSchema(name: string): Promise<string> {
    const { rows } = await this.pool.query(
      `select *
       from public.subqueries
       where name = $1`,
      [name],
    );
    if (rows.length === 0) {
      throw new Error(`unknown project name ${this.config.subqueryName}`);
    }
    return rows[0].db_schema;
  }
}
