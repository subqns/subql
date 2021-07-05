import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection as TypeOrm } from 'typeorm';
import { CreateCatDto, UpdateCatDto, DeleteCatDto } from './Cat.dto';
import { Cat } from './Cat.entity';

@Injectable()
export class CatService {
  constructor(
    @InjectRepository(Cat)
    private readonly ormCatRepository: Repository<Cat>,
  ) // private readonly typeorm: TypeOrm,
  {}

  async onModuleInit(): Promise<void> {
    // this.data = await this.auto.run();
    // let name = this.nodeConfig.subqueryName;
    // this.dbSchema = `subquery_${name}`;
    // this.ormCatRepository = this.typeorm.getRepository(Cat);
  }
  // private readonly cats: Cat[] = [];
  // private data: any;
  private dbSchema: string;
  // private ormCatRepository: Repository<Cat>;

  async create(cat: CreateCatDto): Promise<Cat> {
    const ormcat = new Cat();
    ormcat.name = cat.name;
    ormcat.age = cat.age;
    ormcat.breed = cat.breed;
    console.log(ormcat);

    return await this.ormCatRepository.save(ormcat);
  }

  async update(cat: UpdateCatDto): Promise<Cat> {
    const ormcat = await this.ormCatRepository.findOne(cat.id);
    console.log(cat, ormcat);
    if (cat.name) {
      console.log(`update name`);
      ormcat.name = cat.name;
    }
    if (cat.age) {
      console.log(`update age`);
      ormcat.age = cat.age;
    }
    if (cat.breed) {
      console.log(`update breed`);
      ormcat.breed = cat.breed;
    }
    console.log(`changed: ${ormcat}`);
    return await this.ormCatRepository.save(ormcat);
  }

  async delete(cat: DeleteCatDto) {
    await this.ormCatRepository.delete(cat.id);
  }

  async findAll(): Promise<Cat[]> {
    return await this.ormCatRepository.find();
  }

  async findOne(id: number): Promise<Cat> {
    return await this.ormCatRepository.findOne(id);
  }
}
