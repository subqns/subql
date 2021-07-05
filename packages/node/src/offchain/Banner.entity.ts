import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
    nullable: false,
    default: 'default',
  })
  name: string;

  @Column({
    nullable: false,
  })
  url: string;
}

/*======== offchain_banner ======== 
 `CREATE TABLE IF NOT EXISTS ${offchainSchema}.offchain_banners (
   id SERIAL NOT NULL PRIMARY KEY,
   name TEXT UNIQUE NOT NULL DEFAULT 'default',
   url TEXT NOT NULL
 )`,
 `INSERT INTO ${offchainSchema}.offchain_banners (url) VALUES ('https://dummyimage.com/1200x800') ON CONFLICT DO NOTHING`,
*/
