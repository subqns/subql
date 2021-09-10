//[object Object]
// SPDX-License-Identifier: Apache-2.0

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Subqns } from './Subqns.entity';

@Injectable()
export class SubqnsService implements OnModuleInit {
  constructor(
    @InjectRepository(Subqns)
    private readonly subqueryRepository: Repository<Subqns>,
  ) {}

  async onModuleInit(): Promise<void> {
  }

  create(something: DeepPartial<Subqns>): Subqns {
    return this.subqueryRepository.create(something);
  }

  async findOne(condition: any): Promise<Subqns> {
    return this.subqueryRepository.findOne(condition);
  }

  async save(subquery: Subqns): Promise<void> {
      await this.subqueryRepository.save(subquery);
  }

}
