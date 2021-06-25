import { Column, Entity, PrimaryGeneratedColumn, Check, CreateDateColumn, Index } from 'typeorm';

@Entity()
@Check(`"count" > 0`)
export class NftView {
  @PrimaryGeneratedColumn({
    type: "bigint",
  })
  id: number;

  @Index({ unique: false })
  @Column({
    nullable: false,
  })
  viewerId: string;

  @Index({ unique: false })
  @Column({
    nullable: false,
  })
  nftId: string;

  @Column({
    nullable: false,
    default: 1,
  })
  count: number;

  @CreateDateColumn({
    type: "timestamptz",
    default: "",
  })
  timestamp: Date;
}

/*
CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_nft_views (
  id bigserial PRIMARY KEY,
  viewer_id text NOT NULL,
  nft_id text NOT NULL,
  count INTEGER DEFAULT 1 CHECK (count > 0),
  "timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP
)
*/
// `CREATE INDEX IF NOT EXISTS offchain_nft_views_viewer ON ${offchainSchema}.offchain_nft_views USING btree(viewer_id);`,
// `CREATE INDEX IF NOT EXISTS offchain_nft_views_nft ON ${offchainSchema}.offchain_nft_views USING btree(nft_id);`,
