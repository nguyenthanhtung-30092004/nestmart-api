import { Controller, Post, UseGuards, Request, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(AuthGuard('jwt')) // Yêu cầu đăng nhập cho toàn bộ API đơn hàng
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    // API Đặt hàng: POST /orders/checkout
  @Post('checkout')
  checkout(@Req() req: any) {
    return this.ordersService.placeOrder(req.user.userId);
  }

   // API Lịch sử mua hàng: GET /orders
  @Get()
  getMyOrders(@Req() req: any) {
    return this.ordersService.getMyOrders(req.user.userId);
  }
}
