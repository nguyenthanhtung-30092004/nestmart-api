import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { promises } from 'dns';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Kiểm tra xem Email đã có ai đăng ký chưa ?
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) throw new ConflictException('Email này đã được sử dụng');

    // 2. Băm mật khẩu (Hash Password)
    // Số 10 là 'saltRounds' - độ phức tạp của thuật toán. Số càng to càng an toàn nhưng server tính chậm. 10 là hợp lý
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Lưu vào db
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password: hashedPassword,
      },
    });

    // 4. Trả thông tin (Lấy toàn bộ data trừ password ra)
    const userWithoutPassword = { ...newUser };
    delete (userWithoutPassword as { password?: string }).password;
    return userWithoutPassword;
  }

  private async generateTokens(userId: number, email: string, role: string){
    const payload = {sub: userId, email, role}

    const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {expiresIn: '15m'}),
        this.jwtService.signAsync(payload, {expiresIn: '7d'})
    ])

    return {accessToken, refreshToken}
  }

  private async updateRefreshTokenInDb(userId: number, refreshToken: string | null){
    if(!refreshToken){
        // Nếu truyền null (Đăng xuất) => xóa token trong db
        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                refreshToken: null
            }
        })
        return
    }

    // Băm refresh Token trước khi lưu
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async login(dto: LoginDto) {
    // 1. Tìm user dựa vào Email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');

    // 2. Kiểm tra mật khẩu nhập có khớp với mật khẩu đã băm trong DB không ?
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');

    // 3. Tạo Payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 4. Ký mộc đỏ và cấp thẻ
    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // 5. Lưu RefreshToken băm vào DB
    await this.updateRefreshTokenInDb(user.id, tokens.refreshToken)

    return {
      message: 'Đăng nhập thành công',
      ...tokens,
    };
  }

  async refreshTokens(userId: number, refreshToken: string){
    const user = await this.prisma.user.findUnique({
        where: {
            id: userId
        }
    })

    if(!user || !user.refreshToken) throw new ForbiddenException('Truy cập bị từ chối (Không tìm thấy token trong DB)')

    // So sánh refresh Token gửi lên với RefreshToken đã băm trong DB
    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken)

    if(!isRefreshTokenValid) throw new ForbiddenException('Refresh Token không hợp lệ hoặc đã bị thay thế')

    // Sinh bộ Token mới tinh
    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // Cập nhật lại refresh Token mới vào DB
    await this.updateRefreshTokenInDb(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number){
    await this.updateRefreshTokenInDb(userId, null)
    return {message: 'Đăng xuất thành công'}
  }
}
