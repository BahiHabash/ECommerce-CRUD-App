import { NotFoundException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { UserService } from 'src/user/user.service';
import type { User } from 'src/user/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly userService: UserService,
  ) {}

  /**
   * Create new Product
   * @param createProductDto product data
   * @param userId id of the current loged-in user
   * @returns the new created product
   */
  public async createOne(
    createProductDto: CreateProductDto,
    userId: number,
  ): Promise<Product> {
    const user: User = await this.userService.getOne(userId);

    const newProduct = this.productRepository.create({
      ...createProductDto,
      title: createProductDto.title.toLowerCase(),
      user,
    });

    return await this.productRepository.save(newProduct);
  }

  /**
   * Get All Products
   * @param queryObj Query to filter product with
   * @returns All Product Stored in the DB
   */
  public async getAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  /**
   * Get Product by ID
   * @param id id of the target Product
   * @returns the target product
   */
  public async getOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Update an existed Product
   * @param id id of the product to be updated
   * @param updateProductDto product data
   * @returns the new uppdated product
   */
  public async updateOne(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updatedProduct: Product = this.productRepository.merge(
      product,
      updateProductDto,
    );

    return await this.productRepository.save(updatedProduct);
  }

  /**
   * Delete Product by ID
   * @param id id of the target product
   */
  public async deleteOne(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
