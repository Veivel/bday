import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TimezoneDocument = Timezone & Document;

@Schema()
export class Timezone {
  @Prop({ required: true, unique: true })
  identifier: string; // TZ identifier, e.g. "America/New_York"

  @Prop({ required: true })
  utcOffset: string; // offset in hours, e.g. "+05:30"

  @Prop({ required: true })
  abbreviation: string; // name abbreviation, e.g. "EST"
}

export const TimezoneSchema = SchemaFactory.createForClass(Timezone);
