import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('❌ DATABASE_URL chưa được khai báo trong file .env!');
    }

    // 1. Tạo pool kết nối PostgreSQL sử dụng thư viện pg thuần
    const pool = new Pool({ connectionString });

    // 2. Khởi tạo Prisma adapter từ pool đó
    const adapter = new PrismaPg(pool);

    // 3. Truyền adapter vào constructor của Prisma Client
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Đã kết nối thành công tới Database PostgreSQL!');
  }
}
