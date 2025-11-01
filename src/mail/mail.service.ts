import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}
  async sendEmail(userEmail: string): Promise<boolean> {
    await this.mailerService.sendMail({
      to: userEmail,
      from: this.configService.get<string>('EMAIL_SENDER'),
      subject: 'Test',
      html: `<p> <h1> Hello </h1> </p>`,
    });
    return true;
  }

  async sendWelcomeMessage(
    email: string,
    username: string,
    url: string,
  ): Promise<boolean> {
    // 5. Send the email
    await this.mailerService.sendMail({
      to: email,
      from: this.configService.get<string>('EMAIL_FROM'),
      subject: `Welcome to ECommerce! Please Verify Your Email`,
      template: './register-email.template.ejs',
      context: {
        username: username,
        verificationUrl: url,
      },
    });

    return true;
  }
}
