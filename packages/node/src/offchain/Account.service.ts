import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './Account.entity';

@Injectable()
export class AccountService implements OnModuleInit {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async onModuleInit(): Promise<void> {
    // insert alice
    let alice = new Account('65ADzWZUAKXQGZVhQ7ebqRdqEzMEftKytB8a7rknW82EASXB');
    alice.name = 'alice';
    console.log(`inserting account alice ${alice}`);
    await this.accountRepository.manager.connection
      .createQueryBuilder()
      .insert()
      .into(Account)
      .values(alice)
      .orIgnore()
      .execute();

    // insert bob
    let bob = new Account('63b4iSPL2bXW7Z1ByBgf65is99LMDLvePLzF4Vd7S96zPYnw');
    bob.name = 'bob';
    console.log(`inserting account bob ${bob}`);
    await this.accountRepository.manager.connection
      .createQueryBuilder()
      .insert()
      .into(Account)
      .values(bob)
      .orIgnore()
      .execute();
  }
}
