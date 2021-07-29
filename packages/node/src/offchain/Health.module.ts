import { Module } from '@nestjs/common';
import { HealthController } from './Health.controller';
import { HealthService } from './Health.service';

@Module({
  imports: [],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
