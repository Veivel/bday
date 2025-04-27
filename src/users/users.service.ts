import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import {
  Timezone,
  TimezoneDocument,
} from 'src/timezones/schemas/timezones.schema';
import { DateTime } from 'luxon';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Timezone.name) private tzModel: Model<TimezoneDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const tz = await this.tzModel.findOne({ identifier: dto.timezone }).exec();
    if (!tz) {
      throw new NotFoundException(`Timezone ${dto.timezone} not found`);
    }

    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (Boolean(user)) {
      throw new BadRequestException(`User with email already exists`);
    }

    // get UTC representation of birthdate at 00:00 local tz
    const date: luxon.DateTime = DateTime.fromFormat(
      `${dto.birthDate} 00:00:00`,
      'yyyy-MM-dd HH:mm:ss',
      {
        zone: dto.timezone,
      },
    );

    const nextBirthDay: luxon.DateTime = DateTime.fromObject(
      {
        year: DateTime.now().year,
        month: date.month,
        day: date.day,
        hour: date.hour,
        minute: date.minute,
      },
      {
        zone: dto.timezone,
      },
    );

    // user validation already done by DTO
    const newUser = new this.userModel({
      name: dto.name,
      email: dto.email,
      timezone: tz._id,
      birthDate: date.toUTC().toISO(),
      nextBirthWish: nextBirthDay.toUTC().toISO(),
    });
    const created = await newUser.save();
    return created.populate<{ timezone: Timezone }>('timezone');
  }

  findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .populate<{ timezone: Timezone }>('timezone')
      .exec();
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email: email })
      .populate<{ timezone: Timezone }>('timezone')
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }
    return user;
  }

  async findByObjectId(id: string): Promise<User> {
    try {
      const user = await this.userModel
        .findById(id)
        .populate<{ timezone: Timezone }>('timezone')
        .exec();
      if (!user) {
        throw new NotFoundException(`User ${id} not found`);
      }
      return user;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async remove(email: string): Promise<void> {
    const res = await this.userModel.deleteOne({ email: email }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
  }

  async removeByObjectId(objectId: string): Promise<void> {
    const res = await this.userModel.deleteOne({ _id: objectId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException(`User ${objectId} not found`);
    }
  }
}
