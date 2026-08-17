import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOrderConfirmation(
    email: string,
    orderId: number,
    totalAmount: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Xác nhận đơn hàng #${orderId} tại NestMart`,
      text: `Cảm ơn bạn đã đặt hàng! Tổng thanh toán của bạn là: ${totalAmount}$. Đơn hàng sẽ sớm được giao.`, // Nội dung chữ
      html: `<b>Cảm ơn bạn đã đặt hàng!</b> <br/> Tổng thanh toán của bạn là: <b style="color:red">${totalAmount}$</b>. <br/>Đơn hàng sẽ sớm được giao.`,
    });
    console.log(`Đã gửi mail thành công tới #${email}`);
  }
}
