import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection as TypeOrm } from 'typeorm';
import { CreateCatDto, UpdateCatDto, DeleteCatDto } from '../cat.dto';
import { OrmCat } from './cat.entity';

@Injectable()
export class OrmCatService {
  constructor(
    @InjectRepository(OrmCat)
    private readonly ormCatRepository: Repository<OrmCat>,
    // private readonly typeorm: TypeOrm,
  ) {}

  async onModuleInit(): Promise<void>{
    // this.data = await this.auto.run();
    // let name = this.nodeConfig.subqueryName;
    // this.dbSchema = `subquery_${name}`;
    // this.ormCatRepository = this.typeorm.getRepository(OrmCat);
  }
  // private readonly cats: Cat[] = [];
  // private data: any;
  private dbSchema: string;
  // private ormCatRepository: Repository<OrmCat>;

  async create(cat: CreateCatDto): Promise<OrmCat> {
    const ormcat = new OrmCat();
    ormcat.name = cat.name;
    ormcat.age = cat.age;
    ormcat.breed = cat.breed;
    console.log(ormcat);

    return await this.ormCatRepository.save(ormcat);
  }

  async update(cat: UpdateCatDto): Promise<OrmCat> {
    const ormcat = await this.ormCatRepository.findOne(cat.id);
    console.log(cat, ormcat);
    if (cat.name) {
        console.log(`update name`)
        ormcat.name = cat.name;
    }
    if (cat.age) {
        console.log(`update age`)
        ormcat.age = cat.age;
    }
    if (cat.breed) {
        console.log(`update breed`)
        ormcat.breed = cat.breed;
    }
    console.log(`changed: ${ormcat}`);
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

}
