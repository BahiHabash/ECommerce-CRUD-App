import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductService } from './product.service';

@Controller('api/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  public createProduct(@Body() body: CreateProductDto) {
    return this.productService.createOne(body);
  }

  @Get()
  public getAllProducts() {
    return this.productService.getAll();
  }

  @Get(':id')
  public getSingleProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getOne(id);
  }

  @Patch(':id')
  public updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    return this.productService.updateOne(id, body);
  }

  @Delete(':id')
  public deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteOne(id);
  }
}
