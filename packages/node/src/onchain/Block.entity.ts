import {
  Column,
  Entity,
  PrimaryColumn,
  Check,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class Block {
  @PrimaryColumn({
    type: 'text',
  })
  id: string;

  @Column()
  hash: string;

  @Column()
  parentHash: string;

  @Column({
    nullable: true,
  })
  timestamp: Date;
}
