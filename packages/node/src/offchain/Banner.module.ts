import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './Banner.entity';
import { BannerController } from './Banner.controller';
import { BannerService } from './Banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  providers: [BannerService],
  controllers: [BannerController],
})
export class BannerModule {}
