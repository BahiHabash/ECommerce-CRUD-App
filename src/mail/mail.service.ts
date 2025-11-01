import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send Verification Email Token To User Via Mail
   *
   * @param email email to send token to
   * @param username username of the email's user
   * @param url url to be sent and used by user
   * @returns {Promise<boolean>} True if success, False otherwise
   */
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

  /**
   * Send Password Reset Token To User Via Mail
   *
   * @param email email to send token to
   * @param username username of the email's user
   * @param url url to be sent and used by user
   * @returns {Promise<boolean>} True if success, False otherwise
   */
  async passwordResetEmail(
    email: string,
    username: string,
    url: string,
  ): Promise<boolean> {
    // 5. Send the email
    await this.mailerService.sendMail({
      to: email,
      from: this.configService.get<string>('EMAIL_FROM'),
      subject: `Reset Your Password`,
      template: './reset-password.template.ejs',
      context: {
        username: username,
        passwordRestUrl: url,
      },
    });

    return true;
  }
}
