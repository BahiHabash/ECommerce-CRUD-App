import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(
    email: string,
    username: string,
    url: string,
  ): Promise<boolean> {
    // 5. Send the email
    await this.mailerService.sendMail({
      to: email,
      from: this.configService.get<string>('EMAIL_FROM'),
      subject: `Welcome to ECommerce! Please Verify Your Email`,
      template: './verify-email.template.ejs',
      context: {
        username: username,
        verificationUrl: url,
      },
    });

    return true;
  }
}
