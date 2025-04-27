import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Timezone } from '@/timezones/schemas/timezones.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  email: string;

  // important: need to populate when fetching
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timezone',
    required: true,
  })
  timezone: Timezone;

  // ISO-8601 UTC rep of birthday at 00:00:00 local tz
  @Prop({
    required: true,
    type: Date,
  })
  birthDate: Date;

  @Prop({
    required: true,
    type: Date,
  })
  nextBirthWish: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
