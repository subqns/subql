import {SubstrateBlock, SubstrateExtrinsic, SubstrateEvent} from '@subquery/types';
import {BlockModule} from './Block.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './Block.entity';
import { BlockService } from './Block.service';
import { Subqns } from './Subqns.entity';
import { SubqnsService } from './Subqns.service';


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
  imports: [TypeOrmModule.forFeature([Block, Subqns])],
  providers: [BlockService, SubqnsService],
  controllers: [],
  exports: [BlockService, SubqnsService],
})
export class OnchainModule {}
