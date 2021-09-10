import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './Block.entity';
import { SubstrateBlock } from '@subquery/types';

@Injectable()
export class BlockService implements OnModuleInit {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  async onModuleInit(): Promise<void> {
  }

  async save(block: SubstrateBlock): Promise<void> {
      const blk = new Block();
      blk.id = block.block.header.number.toString();
      // blk.hash = block.createdAtHash.toString();
      blk.hash = block.block.header.hash.toString();
      blk.parentHash = block.block.header.parentHash.toString();
      // blk.timestamp = block.block.header.timestamp();
      // await blk.save();
      // console.log(JSON.stringify(blk));
      await this.blockRepository.save(blk);
  }

}
