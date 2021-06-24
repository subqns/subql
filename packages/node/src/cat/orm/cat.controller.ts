import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, DeleteCatDto } from '../cat.dto';
import { OrmCat } from './cat.entity';
import { OrmCatService } from './cat.service';

@Controller('/api/ormcat')
export class OrmCatController {
  constructor(private readonly ormCatService: OrmCatService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto): Promise<OrmCat> {
    return await this.ormCatService.create(createCatDto);
  }

  @Put()
  async update(@Body() updateCatDto: UpdateCatDto): Promise<OrmCat> {
    return await this.ormCatService.update(updateCatDto);
  }

  @Get()
  async findAll(): Promise<OrmCat[]> {
    return await this.ormCatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<OrmCat> {
    return await this.ormCatService.findOne(id);
  }

  @Delete()
  async delete(@Body() deleteCatDto: DeleteCatDto): Promise<void> {
    return await this.ormCatService.delete(deleteCatDto);
  }
}
