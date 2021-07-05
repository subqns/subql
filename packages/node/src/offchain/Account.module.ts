import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './Account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [],
  controllers: [],
})
export class AccountModule {}
