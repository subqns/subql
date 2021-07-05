import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cat } from './Cat.entity';
import { CatController } from './Cat.controller';
import { CatService } from './Cat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cat])],
  providers: [CatService],
  controllers: [CatController],
})
export class CatModule {}
