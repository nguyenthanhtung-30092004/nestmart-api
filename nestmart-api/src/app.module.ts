import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MailModule } from './mail/mail.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { PaymentModule } from './payment/payment.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ProductsModule,
    UsersModule,
    OrdersModule,
    PrismaModule,
    CategoriesModule,
    AuthModule,
    CartModule,
    ReviewsModule,
    MailModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    BullModule.forRoot({
      connection: {
        host: 'redis',
        port: 6379,
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'redis',
            port: 6379,
          },
        }),
      }),
    }),
    PaymentModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Triển khai hàm configure để đăng ký middleware
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // gọi bảo vệ cổng
      .forRoutes('*'); // đăng ký cho tất cả các router
  }
}
