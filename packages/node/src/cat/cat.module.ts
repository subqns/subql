import { Module } from '@nestjs/common';
import { CatController } from './cat.controller';
import { CatService } from './cat.service';
import { DbModule } from '../db/db.module';

@Module({
    imports: [DbModule],
    controllers: [CatController],
    providers: [CatService],
})

export class CatModule {}