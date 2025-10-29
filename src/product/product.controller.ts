import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductService } from './product.service';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { Roles } from 'src/user/decorators/user-role.decorator';
import { UserRoleEnum } from 'src/utils/enums';
import { UserPayload } from 'src/user/decorators/user-payload.decorator';
import type { JWTPayloadType } from 'src/utils/types';

@Controller('api/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(AuthRolesGuard)
  public createProduct(
    @Body() body: CreateProductDto,
    @UserPayload() payload: JWTPayloadType,
  ) {
    return this.productService.createOne(body, payload.userId);
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
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(AuthRolesGuard)
  public updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    return this.productService.updateOne(id, body);
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(AuthRolesGuard)
  public deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteOne(id);
  }
}
