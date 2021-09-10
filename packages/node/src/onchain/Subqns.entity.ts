import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Check,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class Subqns {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({
    unique: true,
  })
  name: string;

  @Column()
  dbSchema: string;

  @Column({
    nullable: true,
    default: 0,
  })
  version: number;

  @Column()
  hash: string;

  @Column({
    nullable: true,
    default: 1,
  })
  nextBlockHeight: number;

  @Column({
    nullable: true,
  })
  network: string;

  @Column({
    nullable: true,
  })
  networkGenesis: string;
}

