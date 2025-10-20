import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @Length(3, 100)
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @MinLength(5)
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Max(1000)
  @Min(1)
  price: number;
}
