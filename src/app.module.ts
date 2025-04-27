import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TimezonesModule } from './timezones/timezones.module';
import { UsersModule } from './users/user.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/birthday'),
    TimezonesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
