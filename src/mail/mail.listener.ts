import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';

interface UserRegisteredPayload {
  url: string;
  email: string;
  username: string;
}

@Injectable()
export class MailListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.registered', { async: true })
  async handleUserRegisteredEvent(payload: UserRegisteredPayload) {
    const { email, username, url } = payload;
    try {
      await this.mailService.sendWelcomeMessage(email, username, url);
      console.log(
        `${new Date().toTimeString()} Registeration Email sent to: ${email}`,
      );
    } catch (err) {
      console.error(
        `${new Date().toTimeString()} User-Registerd-Event failed to send mail to: ${email}`,
        err,
      );
    }
  }

  @OnEvent('user.sendEmailVerification', { async: true })
  async handlesendEmailVerificationdEvent(payload: UserRegisteredPayload) {
    const { email, username, url } = payload;
    try {
      await this.mailService.sendWelcomeMessage(email, username, url);
      console.log(
        `${new Date().toTimeString()} Registeration Email sent to: ${email}`,
      );
    } catch (err) {
      console.error(
        `${new Date().toTimeString()} User-Registerd-Event failed to send mail to: ${email}`,
        err,
      );
    }
  }
}
