import { Module } from '@nestjs/common';
import { CatController } from './cat.controller';
import { CatService } from './cat.service';
import { DbModule } from '../db/db.module';

// this module is based on cat entity managed by sequelize

@Module({
  imports: [DbModule],
  controllers: [CatController],
  providers: [CatService],
})
export class CatModule {}
