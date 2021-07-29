import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor(){}

  ok() : string {
    return "OK"
  }

}
