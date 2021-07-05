import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { CreateCatDto, UpdateCatDto, DeleteCatDto } from '../cat.dto';
import { Banner } from './Banner.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  async onModuleInit(): Promise<void> {
    // insert placeholder
    let placeholder = new Banner();
    placeholder.url = 'https://dummyimage.com/1200x800';
    console.log(`inserting placeholder banner ${placeholder}`);
    await this.bannerRepository.manager.connection
      .createQueryBuilder()
      .insert()
      .into(Banner)
      .values(placeholder)
      .orIgnore()
      .execute();
  }

  async findAll(): Promise<Banner[]> {
    return await this.bannerRepository.find();
  }

  async findOne(name: string): Promise<Banner> {
    return await this.bannerRepository.findOne({ name });
  }

  // private readonly cats: Cat[] = [];
  // private data: any;
  /*
  private dbSchema: string;
  private ormCatRepository: Repository<OrmCat>;

  async create(cat: CreateCatDto): Promise<OrmCat> {
    const ormcat = new OrmCat();
    ormcat.name = cat.name;
    ormcat.age = cat.age;
    ormcat.breed = cat.breed;
    console.log(ormcat);

    return await this.ormCatRepository.save(ormcat);
  }

  async update(cat: UpdateCatDto): Promise<OrmCat> {
    const ormcat = new OrmCat();
    ormcat.id = cat.id;
    if (cat.name) ormcat.name = cat.name;
    if (cat.age) ormcat.age = cat.age;
    if (cat.breed) ormcat.breed = cat.breed;
    return await this.ormCatRepository.save(ormcat);
  }

  async delete(cat: DeleteCatDto){
    await this.ormCatRepository.delete(cat.id);
  }

  async findAll(): Promise<OrmCat[]> {
    return await this.ormCatRepository.find();
  }

  async findOne(id: number): Promise<OrmCat> {
    return await this.ormCatRepository.findOne(id);
  }
*/
}
