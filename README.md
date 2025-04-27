## Run Locally

**Configure environment variables**

Copy `.env.example` to `.env`, then populate the entries.

**Install dependencies**
```
pnpm i
```

**Seed 'timezones' collection**
```
npm run seed
```

**Run entirely in Docker**
```
docker compose -f docker-compose.yml up
```

**Run only DB in Docker**
```
docker compose -f docker-compose.dev.yml up
npm run start
```

**Test API endpoints**

Import `postman_collection.json` to Insomnia or Postman.

**Run the worker**

The worker is part of the NestJS application (in `/src/wish`), 
including the cron scheduler.

## Design

I chose NestJS because of how opinionated the design is. Best practices should not be
lingering questions for me to ponder upon particularly in this assignment/test.

NestJS is inherently a domain-driven framework, which explains why
I made three modules: users (user management), timezones (for IANA timezones), 
and wish (sending the birthday wishes).

Each module has its own schema (model/entity), DTO, as well as controllers and services. 
Validation happens in the classes like DTOs and schemas (powered by `class-validator`) and also a bit in the service.
With more time, I would have refactored the validation be in the DTOs and schemas as much as possible.

Majority of other design decisions were taken from official docs: https://docs.nestjs.com/

```go
├── ...
├── Dockerfile
├── docker-compose.dev.yml  // for development
├── docker-compose.yml      // for deployment
├── scripts/                // to seed the "timezones" db
├── src/
│   ├── ...
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│   ├── timezones/          // timezones module
│   ├── users/              // users module
│   └── wish/               // birthday wishes module (worker)
├── test/                   // unit tests
└── ...
```

## Limitations

- Verifying email address is not a fake one when creating a new user.
- Fulfilling birthday wish backlog if server or cron worker goes down for several hours / fault tolerance
- Comprehensive testing (the unit testing done was limited)
- Entity validation should be either domain-based or service-based - currently it is both... (see create-user DTO and createUser service)