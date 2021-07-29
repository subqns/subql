import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { HealthService } from './Health.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller(['/api/health', '/health'])
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  ok(): string {
    return this.healthService.ok();
  }

}
