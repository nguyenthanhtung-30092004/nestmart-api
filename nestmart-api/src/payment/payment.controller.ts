import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook xác nhận thanh toán' })
  @ApiHeader({
    name: 'x-signature',
    required: true,
    description: 'Chữ ký HMAC SHA256 của payload theo chuẩn đối tác',
  })
  @ApiBody({ type: PaymentWebhookDto })
  async receiveWebhook(
    @Body() payload: PaymentWebhookDto,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentService.handleWebhook(payload, signature);
  }
}
