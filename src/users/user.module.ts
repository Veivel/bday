import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Timezone,
  TimezoneSchema,
} from 'src/timezones/schemas/timezones.schema';
import { User, UserSchema } from 'src/Users/schemas/user.schema';
import { UsersController } from 'src/Users/users.controller';
import { UsersService } from 'src/Users/users.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Timezone.name, schema: TimezoneSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
