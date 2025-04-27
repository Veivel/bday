import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Timezone } from 'src/timezones/schemas/timezones.schema';

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

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timezone',
    required: true,
  })
  timezone: Timezone;

  @Prop({
    required: true,
  })
  birthday: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
