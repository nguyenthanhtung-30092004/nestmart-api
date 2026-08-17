import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Hàm lấy toàn bộ danh mục
  async getAllProducts(query: FilterProductDto = {}) {
    const { page = 1, limit = 10, search, categoryId } = query;
    const cacheKey = `products_all:${JSON.stringify({ page, limit, search, categoryId })}`;

    // Bước 1: Kiểm tra xem trên redis đã có dữ liệu chưa
    const cachedProducts = await this.cacheManager.get(cacheKey);
    if (cachedProducts) {
      console.log(
        '⚡ [CACHE HIT] Lấy danh sách sản phẩm trực tiếp từ REDIS (RAM)',
      );
      return cachedProducts;
    }

    console.log(
      '🐢 [CACHE MISS] Chui xuống PostgreSQL lấy dữ liệu từ ổ cứng...',
    );

    // 1. Tính toán vị trí bỏ qua (skip)
    const skip = (page - 1) * limit;

    // 2. Xây dựng điều kiện lọc (where clause động)
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 3. Chạy 2 lệnh SQL song song bằng Promise.all để tối ưu hiệu năng
    const [products, totalItem] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // 4. Tính tổng số trang
    const totalPages = Math.ceil(totalItem / limit);
    const result = {
      data: products,
      meta: {
        totalItem,
        itemCount: products.length,
        itemPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };

    await this.cacheManager.set(cacheKey, result, 60000);

    return result;
  }

  // Hàm tạo sản phẩm
  async createProduct(dto: CreateProductDto) {
    const categoryExists = await this.prisma.category.findUnique({
      where: {
        id: dto.categoryId,
      },
    });

    if (!categoryExists)
      throw new NotFoundException(
        `Không tìm thấy danh mục với ID = ${dto.categoryId}`,
      );

    const newProduct = await this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        categoryId: dto.categoryId,
      },
    });

    await this.cacheManager.del('product_all');
    console.log(
      '🧹 [CACHE INVALIDATED] Đã xóa cache cũ do có sản phẩm mới được tạo!',
    );
    return newProduct;
  }
}
