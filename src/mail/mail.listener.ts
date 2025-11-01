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
  @OnEvent('user.verificationEmail', { async: true })
  async handlesendEmailVerificationdEvent(payload: UserRegisteredPayload) {
    const { email, username, url } = payload;
    try {
      await this.mailService.sendVerificationEmail(email, username, url);
    } catch (err) {
      console.error(
        `${new Date().toTimeString()} User-Registerd-Event failed to send mail to: ${email}`,
        err,
      );
    }
  }
}
