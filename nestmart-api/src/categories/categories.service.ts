import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Hàm lấy toàn bộ danh mục trong PostgreSQL
  async getAllCategories() {
    return await this.prisma.category.findMany();
  }

  async createCategory(dto: CreateCategoryDto) {
    return await this.prisma.category.create({
      data: {
        name: dto.name,
      },
    });
  }
}
