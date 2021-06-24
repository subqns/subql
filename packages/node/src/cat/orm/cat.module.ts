import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmCat } from './cat.entity';
import { OrmCatController } from './cat.controller';
import { OrmCatService } from './cat.service';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule], // [TypeOrmModule.forFeature([OrmCat])],
  providers: [OrmCatService],
  controllers: [OrmCatController],
})
export class OrmCatModule {}
