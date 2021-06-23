import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cat } from './cat.interface';
// import { SequelizeAuto } from 'sequelize-auto';
import { Sequelize, QueryTypes } from 'sequelize';
import { NodeConfig } from '../configure/NodeConfig';
import { CreateCatDto, UpdateCatDto, DeleteCatDto } from './cat.dto';

@Injectable()
export class CatService implements OnModuleInit {

  constructor(
        // protected auto: SequelizeAuto,
        protected sequelize: Sequelize,
        protected nodeConfig: NodeConfig,
  ) {}

  async onModuleInit(): Promise<void>{
    // this.data = await this.auto.run();
    let name = this.nodeConfig.subqueryName;
    this.dbSchema = `subquery_${name}`;
  }
  // private readonly cats: Cat[] = [];
  // private data: any;
  private dbSchema: string;

  async create(cat: CreateCatDto): Promise<Cat> {
    // this.cats.push(cat);
    const [result] : Cat[] = await this.sequelize.query(
        `INSERT INTO ${DEFAULT_DB_SCHEMA}.offchain_cats (name, age, breed) VALUES ('${cat.name}', ${cat.age}, '${cat.breed}') returning *`,
        {type: QueryTypes.SELECT},
    );
    return result;
  }

  async update(cat: UpdateCatDto): Promise<Cat> {
    // this.cats.push(cat);
    let quote = (x: any) => (typeof x === 'string') ? `'${x}'` : `${x}`;
    let keys = Object.keys(cat).filter(x=>x!="id");
    let fragment = keys.map((k)=>`${k} = ${quote(cat[k])}`).join(', ');
    console.log(fragment);
    const [result] : Cat[] = await this.sequelize.query(
        `UPDATE ${DEFAULT_DB_SCHEMA}.offchain_cats SET ${fragment} where id = '${cat.id}' returning *`,
        {type: QueryTypes.SELECT},
    );
    return result;
  }

  async delete(cat: DeleteCatDto){
    const result = await this.sequelize.query(
        `DELETE FROM ${DEFAULT_DB_SCHEMA}.offchain_cats where id = ${cat.id}`,
        {type: QueryTypes.DELETE},
    );
    console.log(result);
  }

  async findAll(): Promise<Cat[]> {
    // let data = await this.auto.run();
    // console.log(JSON.stringify(Object.keys(this.data.tables), null, '  '));
    const records : Cat[] = await this.sequelize.query(`SELECT * FROM ${DEFAULT_DB_SCHEMA}.offchain_cats ORDER BY id`, {type: QueryTypes.SELECT});
    // console.log(records);
    return records;
    // return this.cats;
  }
}

const DEFAULT_DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';