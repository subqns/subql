import {SubstrateBlock, SubstrateExtrinsic, SubstrateEvent} from '@subquery/types';
import {BlockModule} from './Block.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './Block.entity';
import { BlockService } from './Block.service';
import { Subquery } from './Subquery.entity';
import { SubqueryService } from './Subquery.service';


export async function processBlock(block: SubstrateBlock) {
  console.log('process block')
}

export async function processEvent(block: SubstrateEvent) {
  console.log('process event')
}

export async function processCall(extrinsic: SubstrateExtrinsic) {
  console.log('process extrinsic')
}

export const OnchainModules = [
  BlockModule,
];

@Module({
  imports: [TypeOrmModule.forFeature([Block, Subquery])],
  providers: [BlockService, SubqueryService],
  controllers: [],
  exports: [BlockService, SubqueryService],
})
export class OnchainModule {}
