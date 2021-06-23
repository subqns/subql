import { Controller, Get, Post, Put, Delete, Body } from '@nestjs/common';
import { CatService } from './cat.service';
import { Cat } from './cat.interface';
import { CreateCatDto, UpdateCatDto, DeleteCatDto } from './cat.dto';

@Controller('/api/cat')
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catService.create(createCatDto);
  }

  @Put()
  async update(@Body() updateCatDto: UpdateCatDto): Promise<Cat> {
    return this.catService.update(updateCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return await this.catService.findAll();
  }

  @Delete()
  async delete(@Body() deleteCatDto: DeleteCatDto): Promise<void> {
    return await this.catService.delete(deleteCatDto);
  }
}