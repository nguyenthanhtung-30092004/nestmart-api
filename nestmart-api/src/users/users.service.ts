import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Hàm xử lý nghiệp vụ lấy danh sách
  getAllUsers() {
    return [
      { id: 1, name: 'Nguyễn Thanh Tùng', role: 'ADMIN' },
      { id: 2, name: 'Nguyễn Văn A', role: 'USER' },
    ];
  }

  // Hàm xử lý nghiệp vụ đăng ký người dùng
  registerUser(userData: Record<string, any>) {
    // console.log('Service đang xử lý lưu vào DB: ', userData);
    if (!userData) {
      throw new BadRequestException('Dữ liệu người dùng không hợp lệ');
    }
    return {
      message: 'Đăng ký thành công',
      user: userData,
    };
  }
}
