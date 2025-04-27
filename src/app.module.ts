import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { TimezonesModule } from './timezones/timezones.module';
import { TimezonesController } from './timezones/timezones.controller';
import { TimezonesService } from './timezones/timezones.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/birthday'),
    TimezonesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
