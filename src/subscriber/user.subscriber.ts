import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
} from 'typeorm';
import { User } from '../user/user.entity';

/**
 * This subscriber listens for events on the User entity.
 * It's used to automatically update the `lastSecurityUpdate` timestamp
 * whenever a user's `passwordHash` is modified.
 */
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  /**
   * Specifies that this subscriber should only listen to events from the User entity.
   */
  listenTo() {
    return User;
  }

  /**
   * Called automatically by TypeORM just before an entity update is executed.
   *
   * @param event The event object containing the old and new entity states.
   */
  beforeUpdate(event: UpdateEvent<User>) {
    // event.databaseEntity contains the user data currently in the database (the "old" state)
    // event.entity contains the user data that is about to be saved (the "new" state)

    if (
      event.entity &&
      event.databaseEntity &&
      event.entity.passwordHash !== event.databaseEntity.passwordHash
    ) {
      // If the password hash has changed, update the lastSecurityUpdate timestamp.
      event.entity.lastSecurityUpdate = new Date();
    }
  }
}
