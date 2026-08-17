import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private readonly PAYMENT_SECRET =
    process.env.PAYMENT_SECRET || 'SUPER_SECRET_KEY_MOMO_VNPAY_123';

  async handleWebhook(payload: any, receivedSignature: string) {
    if (!receivedSignature) {
      throw new NotFoundException('Thiếu chữ ký bảo mật!');
    }

    const secret = this.configService.get<string>('PAYMENT_SECRET');

    const orderId = Number(payload.orderId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng với id = ${orderId}`,
      );
    }

    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', this.PAYMENT_SECRET)
      .update(payloadString)
      .digest('hex');

    console.log(expectedSignature);

    if (expectedSignature !== receivedSignature) {
      console.log('🚨 [CẢNH BÁO HACKER] Chữ ký không hợp lệ!');
      throw new BadRequestException(
        'Chữ ký không hợp lệ. Cảnh báo tấn công giả mạo!',
      );
    }

    console.log(
      '✅ [WEBHOOK HỢP LỆ] Đã xác thực thành công nguồn gửi từ Ngân hàng!',
    );

    const status = String(payload.status ?? '').toUpperCase();
    const isPaid = ['SUCCESS', 'PAID', 'COMPLETED'].includes(status);

    if (!isPaid) {
      return {
        success: false,
        message: 'Đơn hàng chưa thanh toán xong',
        orderId: order.id,
        currentStatus: order.status,
      };
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
      },
    });

    return {
      success: true,
      message: 'Đã cập nhật đơn hàng thành công',
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    };
  }
}
