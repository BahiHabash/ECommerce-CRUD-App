## validation

> install class-validator, class-transformer

## DI

in non-local DI
export service and import module
in circular DI

> in module file use forwardRef(() => OtherModule)
> in service file user @Inject(forwardRef(() => OtherService))

## DB postgresql

> npm i @nest/typeorm typeorm pg

### create entity ?

> create Entity file and import it in the module and also mention the entity in the app module

## DB Relations

class Product {
@ManyToOne(() => User, (user) => user.products, {
eager: true, // auto-load user data
onDelete: 'CASCADE', // auto-remove products if user is deleted
})
user: User;
}

## Interceptors

> Interceptor works before and after the route handler
> for global interceptor add that to the global provider:

    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },

> for local interceptor add @useInterceptrs() decorator to the route handler

## Quick Recap of the Refresh / Access / DB / Redis Flow

Let’s label the roles cleanly:
Access Token → short life (e.g. 15m)
Refresh Token → longer life (e.g. 7d)
Redis Cache → holds “invalid” users (banned, deactivated, security-action-taken)
DB → source of truth

### Flow A — Access Token Verification

JWT Guard extracts userId from token.
Check Redis:
If userId exists → ❌ reject (user banned, deactivated, or under security action).
If not found → ✅ accept request.
If Redis fails → fallback to DB check for user status (safety net).

### Flow B — Refresh Token Flow

User tries to refresh access token.
System checks Redis for userId.
If in Redis → ❌ reject → “Please re-login.”
If not → check issuedAt in token vs lastSecurityAction or statusUpdatedAt in DB.
If token issued before that → ❌ reject.
Else → issue new access token.
Redis TTL = Refresh Token Lifetime

### Flow C — User Status Change

Admin or system updates user status in DB.
System adds userId → Redis cache with TTL = refresh token life.
Any existing access/refresh token instantly invalidated via Redis lookup.

login, register => access, refresh tokens
acc token => check in cache for status
if not found then pass
if failed then fetch from db
if found return based on status
refresh token => check in cache for status
if not found then pass
if failed then fetch from db
if found return based on status

whenever the db updated, updater the cache

## Uploading Files

import multerModule.register() in the module or
user FileInterceptor(MulterOptions) in the controller or
import it in the module and override it in the conroller (you have to override the entire options object).
