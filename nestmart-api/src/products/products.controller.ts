import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get()
  getAllProducts(@Query() query: FilterProductDto) {
    return this.productsService.getAllProducts(query);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('ADMIN')
  createProduct(@Body() body: CreateProductDto) {
    return this.productsService.createProduct(body);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      // Cấu hình kho lưu trữ (Multer)
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Đổi tên file ngẫy nhiên k bị trùng
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),

      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file ảnh JPG, JPEG, PNG!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return {
      message: 'Upload ảnh thành công!',
      filePath: `/uploads/${file.filename}`,
    };
  }
}
