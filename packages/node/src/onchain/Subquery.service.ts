//[object Object]
// SPDX-License-Identifier: Apache-2.0

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Subquery } from './Subquery.entity';

@Injectable()
export class SubqueryService implements OnModuleInit {
  constructor(
    @InjectRepository(Subquery)
    private readonly subqueryRepository: Repository<Subquery>,
  ) {}

  async onModuleInit(): Promise<void> {
  }

  create(something: DeepPartial<Subquery>): Subquery {
    return this.subqueryRepository.create(something);
  }

  async findOne(condition: any): Promise<Subquery> {
    return this.subqueryRepository.findOne(condition);
  }

  async save(subquery: Subquery): Promise<void> {
      await this.subqueryRepository.save(subquery);
  }

}
