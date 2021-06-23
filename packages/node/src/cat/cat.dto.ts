export class CreateCatDto {
    name: string;
    age: number;
    breed: string;
}

export class UpdateCatDto {
    id: string;
    name?: string;
    age?: number;
    breed?: string;
}

export class DeleteCatDto {
    id: string;
}