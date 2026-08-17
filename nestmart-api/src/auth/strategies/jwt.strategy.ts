import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // 1. Dạy bảo vệ lấy Token từ Header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 2. Bỏ qua các token đã hết hạn
      ignoreExpiration: false,  

      // 3. Cung cấp mộc đỏ để bảo vệ soi kỹ
      secretOrKey: process.env.JWT_SECRET || 'SECRET_KEY_FALLBACK',
    });
  }

  // 4. Nếu thẻ thật, hàm validate sẽ tự động chạy
  validate(payload: { sub: number; email: string; role: string }) {
    // Giá trị return ở đây sẽ tự động được NestJS gán vào biến `req.user`
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
