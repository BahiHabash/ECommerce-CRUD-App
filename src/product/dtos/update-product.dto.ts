import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
  Max,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @Length(3, 100)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @MinLength(5)
  @IsString()
  @IsOptional()
  description?: string;

  @Max(1000)
  @Min(1)
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  price?: number;
}
