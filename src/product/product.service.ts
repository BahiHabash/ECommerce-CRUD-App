import { NotFoundException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  public async createOne(dto: CreateProductDto) {
    const newProduct = this.productRepository.create(dto);
    return await this.productRepository.save(newProduct);
  }

  public async getAll() {
    return await this.productRepository.find();
  }

  public async getOne(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  public async updateOne(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updatedProduct = this.productRepository.merge(product, dto);

    return await this.productRepository.save(updatedProduct);
  }

  public async deleteOne(id: number) {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return { message: `Product with ID ${id} has been deleted successfully.` };
  }
}
