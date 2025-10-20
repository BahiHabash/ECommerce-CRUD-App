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
