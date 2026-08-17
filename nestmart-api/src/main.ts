import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động vứt bỏ các dữ liệu rác không có trong DTO,
      forbidNonWhitelisted: true, // Báo lỗi nếu frontend cố tình gửi dữ liệu rác
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NestMart E-commerce API')
    .setDescription('Tài liệu API dành cho Frontend tích hợp')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Lỗi khởi động ứng dụng:', err);
});
