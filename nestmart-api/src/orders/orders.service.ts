import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('mail-queue') private mailQueue: Queue,
  ) {}

  // 1. API đặt hàng
  async placeOrder(userId: number) {
    // Bước 1: Lấy giỏ hàng của User lên kiểm tra
    const cart = await this.prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Nếu giỏ hàng trống không có gì thì báo lỗi, không cho đặt
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('Giỏ hàng của bạn trống');

    // Bước 2: Bắt đầu TRANSACTION (khu vực an toàn tuyệt đối)
    const result = await this.prisma.$transaction(async (tx) => {
      // 2.1 Tính tổng tiền giỏ hàng
      const totalAmount = cart.items.reduce((sum, item) => {
        return sum + item.quantity * item.product.price;
      }, 0);

      // 2.2 TẠO ĐƠN HÀNG
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
        },
      });

      // 2.3 Chụp ảnh giá & copy sang chi tiết đơn hàng (OrderItem)
      const orderItemsData = cart.items.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price, // Quan trọng: Copy giá tiền này vào đây!
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // 2.4 Xóa sạch giỏ hàng
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      // Nếu chạy đến dòng này mà không có lỗi, Database sẽ tự động commit (Chốt lưu vĩnh viễn)
      return newOrder;
    });

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      await this.mailQueue.add('send-order-confirmation', {
        email: user.email,
        orderId: result.id,
        totalAmount: result.totalAmount,
      });
      console.log('Đã ném job gửi email vào queue');
    }

    return {
      message: 'Đặt hàng thành công!',
      orderId: result.id,
    };
  }

  // 2. API Xem lịch sử đơn hàng của bản thân
  async getMyOrders(userId: number) {
    return await this.prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
