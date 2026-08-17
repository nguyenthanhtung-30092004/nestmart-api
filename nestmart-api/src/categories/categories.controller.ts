import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories() {
    return await this.categoriesService.getAllCategories();
  }
  @Post()
  async create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.createCategory(body);
  }
}
