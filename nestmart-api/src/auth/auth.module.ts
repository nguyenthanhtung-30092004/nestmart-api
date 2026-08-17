import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JWTStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Cấu hình JWT
    JwtModule.register({
      global: true, // biến thành module toàn cục
      secret: process.env.JWT_SECRET, // Khóa bí mật
      signOptions: { expiresIn: '1d' }, // Thẻ VIP có hạn sử dụng 1 ngày
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JWTStrategy],
})
export class AuthModule {}
