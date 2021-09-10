import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './Block.entity';
import { BlockService } from './Block.service';

@Module({
  imports: [TypeOrmModule.forFeature([Block])],
  providers: [BlockService],
  controllers: [],
})
export class BlockModule {}
