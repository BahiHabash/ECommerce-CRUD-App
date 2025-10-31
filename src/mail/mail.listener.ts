import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';

@Injectable()
export class MailListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.registered', { async: true })
  async handleUserRegisteredEvent(email: string) {
    try {
      console.log(
        `${new Date().toTimeString()} User-Registerd-Event catched for email: ${email}`,
      );
      await this.mailService.sendWelcomeMessage(email);
      console.log(
        `${new Date().toTimeString()} Registeration Email sent to: ${email}`,
      );
    } catch (err) {
      console.error(
        `${new Date().toTimeString()} User-Registerd-Event failed to send mail to: ${email}`,
      );
      console.error(`Error: ${err}`);
    }
  }

  @OnEvent('user.loggedin', { async: true })
  async handleUserLoggedinEvent(email: string) {
    console.log('Event Emitter for email: ', email);
    try {
      await this.mailService.sendWelcomeMessage(email);
    } catch {
      console.error('Faile to send email to : ', email);
    }
  }
}
