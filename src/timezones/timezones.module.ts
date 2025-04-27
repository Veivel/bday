import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimezonesController } from './timezones.controller';
import { TimezonesService } from './timezones.service';
import { Timezone, TimezoneSchema } from './schemas/timezones.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Timezone.name, schema: TimezoneSchema },
    ]),
  ],
  controllers: [TimezonesController],
  providers: [TimezonesService],
  exports: [TimezonesService],
})
export class TimezonesModule {}
