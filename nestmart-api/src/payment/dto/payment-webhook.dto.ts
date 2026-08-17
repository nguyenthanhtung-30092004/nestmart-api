import { ApiProperty } from '@nestjs/swagger';

export class PaymentWebhookDto {
  @ApiProperty({
    example: 12,
    description: 'ID của đơn hàng cần cập nhật trạng thái',
  })
  orderId: number;

  @ApiProperty({
    example: 'SUCCESS',
    description: 'Trạng thái thanh toán từ đối tác',
  })
  status: string;

  @ApiProperty({
    example: 250000,
    required: false,
    description: 'Số tiền thanh toán',
  })
  amount?: number;

  @ApiProperty({
    example: 'txn_abc123',
    required: false,
    description: 'Mã giao dịch từ cổng thanh toán',
  })
  transactionId?: string;
}
