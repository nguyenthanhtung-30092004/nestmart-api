import { Processor, WorkerHost } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { Job } from 'bullmq';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    console.log(`[Worker] Bắt đầu xử lý job ID: ${job.id}`);

    // Kiểm tra xem bill yêu cầu cần gì
    if (job.name === 'send-order-confirmation') {
      const { email, orderId, totalAmount } = job.data;

      await this.mailService.sendOrderConfirmation(email, orderId, totalAmount);
    }
    console.log(`[Worker] Xong Job ID: ${job.id}`);
  }
}
