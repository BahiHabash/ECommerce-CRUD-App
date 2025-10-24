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

banned, active, deleted, security_issue,

🧩 1️⃣ Can you use it in a monolith?

Absolutely yes.
Redis is not a “microservices-only” tool.
It’s just a high-speed in-memory store — and even in monoliths, it’s common for:

Caching frequent DB reads

Session management

Token blacklisting / status invalidation

Rate limiting

So your design (using Redis to block invalid tokens for banned/deactivated users) works perfectly fine in a monolithic architecture.

👉 In fact, for monoliths, it’s simpler because:

No need for message queues or cross-service sync.

Single codebase → easy to handle cache miss fallbacks.

Redis stays lean (only invalid users).

✅ So yes, use it.

🔄 2️⃣ Quick Recap of the Refresh / Access / DB / Redis Flow

Let’s label the roles cleanly:

Access Token → short life (e.g. 15m)

Refresh Token → longer life (e.g. 7d)

Redis Cache → holds “invalid” users (banned, deactivated, security-action-taken)

DB → source of truth

🧠 Flow A — Access Token Verification
⚙️ Steps:

JWT Guard extracts userId from token.

Check Redis:

If userId exists → ❌ reject (user banned, deactivated, or under security action).

If not found → ✅ accept request.

(Optional) If Redis fails → fallback to DB check for user status (safety net).

🎯 Outcome:

99% of requests skip DB.

Only banned users cause a quick Redis lookup hit.

🧠 Flow B — Refresh Token Flow
⚙️ Steps:

User tries to refresh access token.

System checks Redis for userId.

If in Redis → ❌ reject → “Please re-login.”

If not → check issuedAt in token vs lastSecurityAction or statusUpdatedAt in DB.

If token issued before that → ❌ reject.

Else → ✅ issue new access token.

⏳ Redis TTL = Refresh Token Lifetime

Keeps invalid users blocked for as long as any of their tokens could still be valid.

When TTL expires, refresh token’s already expired → safe cleanup.

🧱 Flow C — User Status Change (Ban, Deactivate, Security Action)

Admin or system updates user status in DB.

System adds userId → Redis cache with TTL = refresh token life.

Any existing access/refresh token instantly invalidated via Redis lookup.

| Case                                     | Description                                                                                        | Handling                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Redis flush/reset**                    | All cache data lost (e.g. crash or manual flush).                                                  | Keep DB check fallback for critical routes (especially refresh endpoint).                  |
| **Multiple sessions/devices**            | User logged in from several devices.                                                               | Optionally store per-device token IDs or session IDs in Redis (fine-grained invalidation). |
| **Clock drift**                          | Token issued time vs Redis TTL mismatches.                                                         | Use server time consistently; store UTC timestamps.                                        |
| **Admin re-activates user early**        | Redis still has record of ban.                                                                     | On activation, explicitly delete user from Redis.                                          |
| **Refresh before Redis write completes** | Edge timing when user status updates but Redis write delays.                                       | Ensure DB transaction commits → then enqueue Redis write → small delay buffer.             |
| **Concurrent status updates**            | e.g. security action + deactivate simultaneously.                                                  | Redis write always overwrites with newest status and TTL refresh.                          |
| **Short TTLs**                           | If you shorten refresh token life → remember to sync TTL logic everywhere (no ghost valid tokens). |                                                                                            |
