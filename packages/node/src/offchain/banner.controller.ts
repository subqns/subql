import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
// import { CreateCatDto, UpdateCatDto, DeleteCatDto } from '../cat.dto';
import { Banner } from './banner.entity';
import { BannerService } from './banner.service';

@Controller('/api/banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async findAll(): Promise<Banner[]> {
    return await this.bannerService.findAll();
  }

  @Get(':name')
  async findOne(@Param('name') name: string): Promise<Banner> {
    return await this.bannerService.findOne(name);
  }

  /*
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

  @Delete()
  async delete(@Body() deleteCatDto: DeleteCatDto): Promise<void> {
    return await this.ormCatService.delete(deleteCatDto);
  }
  */
}
