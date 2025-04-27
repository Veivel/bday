import { Module } from '@nestjs/common';
import { WishService } from './wish.service';
import { WishController } from './wish.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/Users/schemas/user.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
  ],
  controllers: [WishController],
  providers: [WishService],
  exports: [WishService],
})
export class WishModule {}
