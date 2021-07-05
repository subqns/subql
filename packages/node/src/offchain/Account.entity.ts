import {
  Column,
  Entity,
  PrimaryColumn,
  Check,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class Account {
  @PrimaryColumn({
    type: 'text',
    nullable: false,
  })
  id: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  name: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  alias: string;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}

/*
CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_accounts (
  "id" text NOT NULL PRIMARY KEY,
  "balance" bigint,
  "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
  "updated_at" timestamptz NOT NULL DEFAULT current_timestamp
)
*/
