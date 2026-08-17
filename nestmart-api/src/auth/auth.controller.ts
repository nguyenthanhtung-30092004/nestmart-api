import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req: any){
    return this.authService.logout(req.user.userId)
  }

  // API Lấy Access Token mới bằng Refresh Token
  @Post('refresh')
  async refresh(@Headers('x-refresh-token') refreshToken: string, @Body('userId') userId: number){
    console.log(refreshToken,userId)
    if(!refreshToken || !userId){
        throw new UnauthorizedException('Thiếu Refresh Token hoặc UserId');
    }
    return this.authService.refreshTokens(userId, refreshToken)
  }

  // 👇 Thêm API lấy thông tin Profile được bảo vệ
  @UseGuards(AuthGuard('jwt')) // 👈 Đặt Anh bảo vệ ở đây!
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    // Nếu vượt qua được Guard, thông tin user từ hàm `validate` (Bước 2) sẽ nằm ở `req.user`
    return {
      message: 'Chào mừng bạn đến với khu vực VIP',
      user: req.user,
    };
  }
}
