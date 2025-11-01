import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';

interface AuthEventsPayload {
  url: string;
  email: string;
  username: string;
}

@Injectable()
export class MailListener {
  constructor(private readonly mailService: MailService) {}

  /**
   * Handle Event When Verification Email Token Requested
   *
   * @param payload AuthEventsPayload (e.g: url, email, username;
   */
  @OnEvent('auth.verificationEmail', { async: true })
  async sendEmailVerificationdEventHandle(payload: AuthEventsPayload) {
    const { email, username, url } = payload;
    try {
      await this.mailService.sendVerificationEmail(email, username, url);
    } catch (err) {
      console.error(
        `${new Date().toTimeString()} Auth-verificationEmail-Event failed to send mail to: ${email}`,
        err,
      );
    }
  }

  /**
   * Handle Event When Passwrod Reset Token Requested
   *
   * @param payload AuthEventsPayload (e.g: url, email, username;
   */
  @OnEvent('auth.passwordResetRequest', { async: true })
  async passwordResetRequestEventHandler(payload: AuthEventsPayload) {
    const { email, username, url } = payload;
    try {
      await this.mailService.passwordResetEmail(email, username, url);
    } catch (err) {
      console.error(
        `${new Date().toTimeString()} Auth-passwordResetRequest-Event failed to send mail to: ${email}`,
        err,
      );
    }
  }
}
