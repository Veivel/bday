import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TimezoneDocument = Timezone & Document;

@Schema()
export class Timezone {
  @Prop({ required: true, unique: true })
  identifier: string;

  @Prop({ required: true })
  utcOffset: string;

  @Prop({ required: true })
  abbreviation: string;
}

export const TimezoneSchema = SchemaFactory.createForClass(Timezone);
