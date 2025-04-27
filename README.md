# Bday

A birthday service.

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
lingering questions for me to ponder upon particularly in this assignment/test. Additionally, 
I used `luxon` as a library to work with datetime and timezones because Javascript's default
date capabilities can be unintuitive.

NestJS is inherently a domain-driven framework, which explains why
I made three modules: users (user management), timezones (for IANA timezones), 
and wish (sending the birthday wishes).

Each module has its own schema (model/entity), DTO, as well as controllers and services. 
Validation happens in the classes like DTOs and schemas (powered by `class-validator`) and also a bit in the service.
With more time, I would have refactored the validation be in the DTOs and schemas as much as possible.

I decided to put the birthday wishes worker as part of the NestJS app 
because I found a library for my need, `@nestjs/schedule`, which integrates it into the whole backend.
The cron schedule is to run the 'birthday checks' every hour at minute :15. 
It fetches users whose birthdays are within two days (both ways) of the current timestamp, and then
checks if it is between 09.00 - 10.00 in the user's local timezone. If it is, send out an email via Resend.

For the IANA timezone collection, I quickly made [this sheet](https://docs.google.com/spreadsheets/d/14S0vlHBEs1tZHOxv8lZATN4giT4bRU1XrYUECC0ByfM/edit?usp=sharing) via [Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (which is basically a compressed version of the IANA timezone db), before downloading it as a CSV and then making a script to seed the MongoDB collection using the CSV file.

Majority of other design decisions were taken from official docs: https://docs.nestjs.com/

```go
├── ...
├── Dockerfile
├── docker-compose.dev.yml  // for development (dockerized db)
├── docker-compose.yml      // for deployment (dockerized app + db)
├── scripts/                // scripts to seed the "timezones" db
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

- I only do validation to check if the input is **an** email address. I do not verify if it is a real and correct email address.
- Fulfilling birthday wish backlog if server or cron worker goes down for several hours / fault tolerance.
Case in point: server goes down at 8:58AM on some user's birthday (their local tz)... server goes back up at 1pm. Ideally, there should be some fault tolerance to make sure that user still gets wished happy birthday.
- Entity validation should be either domain-based or service-based - currently it is both... (see create-user DTO and createUser service) but ideally I make entitiy validation only occur in the classes e.g. just in the DTOs
- The *biggest* and main limitation of this project here is unit testing - the testing I did was very limited, and ideally I could do more comprehensive testing.