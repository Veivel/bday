# Bday

A birthday service. I addressed the feedback I received at the bottom of this README.

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

## Feedback Resolution

Many of the changes can be seen in the postman collection JSON I included in this repository.

- Thank you for the suggestion. In a normal work setting I would usually ask for input/advice from the team regarding this, but I had to make a call in this particular instance and I agree it could be better standardized. Fixed by changing `GET /users/_id/:id` to `GET /users/:id`, and getting user by email now falls under the `GET /users` endpoint with a search query like `GET /users?email=mymail@mail.com`. Also changed `GET /timezones/identifier/:identifier` to `GET /timezones/:identifier` to follow suit with the API changes above.

- Error handling may not be visible because a lot of the error handling was handled by the DTO classes and the schemas (e.g. I included regexes for birthDate, added email validation for the email address, etc.), so validation happens when initializing the classes. I attached it to the classes as to avoid redundant repetition in the service methods. 

With that being said, I fixed it partially by adding a few manual error checks like when casting string Id to Mongo ObjectId. I also did more manual testing to make sure different cases like malformed JSONs, missing fields, invalid field types, or invalid date/email/timezone values were being handled and thrown properly with clear error messages.

- Thank you for the input, pagination was something I had missed. I added `GET /users?page=3&limit=10` to the GET users endpoint. The timezones table should remain fairly static (any changes wont be too significant) so the pagination is not too relevant.

- Fixed the forEach and made it iterate through a for loop instead, which was not a problem since the function itself was already an async function.

- I have double-checked and tested the functionality, it does not send message at 9 AM UTC but at 9 AM local timezone. birthDate is stored in utc format, but the value it stores is the birthDate at 00:00 in their local timezone. For example:

```json
"birthDate": "2000-01-14T06:00:00.000Z",
"nextBirthWish": "2025-01-14T06:00:00.000Z",
```

This means that 00.00 (local timezone) on their birthday is equal to 06.00 UTC, Jan 14 (6-hour offset as defined in the timezones module).
So the wish service checks if the current time is equals to 9 hours after 00.00 (local timezone) on their birthday,
with the example above it would be 06.00 UTC + 9H = 15.00 UTC. For the user, however, it is 9 AM.
and as I have tested with multiple timezones it will send the message as long as it is between 09.00 and 10.00 (local timezone) on their birthday. This calculation simply uses UTC as a standardized format, but the reference value is 09.00 local timezone.