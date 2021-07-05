import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, DeleteCatDto } from './Cat.dto';
import { Cat } from './Cat.entity';
import { CatService } from './Cat.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('cat')
@Controller('/api/cat')
export class CatController {
  constructor(private readonly ormCatService: CatService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return await this.ormCatService.create(createCatDto);
  }

  @Put()
  async update(@Body() updateCatDto: UpdateCatDto): Promise<Cat> {
    return await this.ormCatService.update(updateCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return await this.ormCatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Cat> {
    return await this.ormCatService.findOne(id);
  }

  @Delete()
  async delete(@Body() deleteCatDto: DeleteCatDto): Promise<void> {
    return await this.ormCatService.delete(deleteCatDto);
  }
}
