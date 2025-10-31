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

  async sendWelcomeMessage(email: string): Promise<boolean> {
    await this.mailerService.sendMail({
      to: email,
      from: this.configService.get<string>('EMAIL_SENDER'),
      subject: 'Register Test',
      template: './register-email.template.ejs',
      context: {
        userName: email.split('@')[0],
      },
    });
    return true;
  }
}
