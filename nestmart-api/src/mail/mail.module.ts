import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.processor';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'kamryn.schamberger54@ethereal.email',
          pass: 'KxAfHr4mhZFMPYRdQp',
        },
      },
      defaults: {
        from: '"NestMart E-Commerce" <noreply@nestmart.com>',
      },
    }),

    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService, BullModule],
})
export class MailModule {}
