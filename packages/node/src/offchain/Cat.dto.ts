import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}

export class UpdateCatDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  breed?: string;
}

export class DeleteCatDto {
  @ApiProperty()
  id: number;
}
