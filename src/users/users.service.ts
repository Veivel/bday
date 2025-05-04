import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import {
  Timezone,
  TimezoneDocument,
} from '@/timezones/schemas/timezones.schema';
import { DateTime } from 'luxon';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResponse } from '@/users/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Timezone.name) private tzModel: Model<TimezoneDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const tz = await this.tzModel.findOne({ identifier: dto.timezone }).exec();
    if (!tz) {
      throw new NotFoundException(`Timezone ${dto.timezone} not found`);
    }

    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (Boolean(user)) {
      throw new BadRequestException(`Email already in use`);
    }

    // get UTC representation of birthdate at 00:00 local tz
    const date: luxon.DateTime = DateTime.fromFormat(
      `${dto.birthDate} 00:00:00`,
      'yyyy-MM-dd HH:mm:ss',
      {
        zone: dto.timezone,
      },
    );

    // check date validity
    try {
      if (!date.isValid) {
        throw new BadRequestException(
          'Recheck your birthDate field (invalid date)',
        );
      }
      if (date >= DateTime.now()) {
        throw new BadRequestException(
          'Recheck your birthDate field (cannot be in the future)',
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      } else {
        throw new InternalServerErrorException(
          'Something went wrong when verifying birthDate',
        );
      }
    }
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

  async findPaginated(
    filter: FilterQuery<UserDocument>,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<User>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .populate<{ timezone: Timezone }>('timezone')
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    if (id === null) {
      throw new BadRequestException('User ID cannot be null');
    }

    // revalidate birth date
    if (dto.birthDate) {
      try {
        const date: luxon.DateTime = DateTime.fromFormat(
          `${dto.birthDate} 00:00:00`,
          'yyyy-MM-dd HH:mm:ss',
          {
            zone: dto.timezone,
          },
        );
        if (!date.isValid) {
          throw new BadRequestException(
            'Recheck your birthDate field (invalid date)',
          );
        }
        if (date >= DateTime.now()) {
          throw new BadRequestException(
            'Recheck your birthDate field (cannot be in the future)',
          );
        }
      } catch (e) {
        if (e instanceof BadRequestException) {
          throw e;
        } else {
          throw new InternalServerErrorException(
            'Something went wrong when verifying birthDate',
          );
        }
      }
    }

    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) throw new NotFoundException(`User ${id} not found`);

      // if changing email
      if (dto.email && dto.email !== user.email) {
        const conflict = await this.userModel
          .findOne({ email: dto.email })
          .exec();
        if (conflict) throw new BadRequestException('Email already in use');
        user.email = dto.email;
      }

      // if changing timezone
      let tzDoc = await this.tzModel.findById(user.timezone).exec();
      if (dto.timezone) {
        tzDoc = await this.tzModel.findOne({ identifier: dto.timezone }).exec();
        if (!tzDoc)
          throw new NotFoundException(`Timezone "${dto.timezone}" not found`);
        user.timezone = tzDoc._id as any;
      }

      // if changing name
      if (dto.name) {
        user.name = dto.name;
      }

      // if changing birthDate or timezone, recompute birthDate & nextBirthWish
      if (dto.birthDate || dto.timezone) {
        const bdayStr = dto.birthDate
          ? dto.birthDate
          : DateTime.fromJSDate(user.birthDate).toFormat('yyyy-MM-dd');

        const dt = DateTime.fromFormat(
          `${bdayStr} 00:00:00`,
          'yyyy-MM-dd HH:mm:ss',
          { zone: tzDoc.identifier },
        );

        // get next occurrence this year
        const next = DateTime.fromObject(
          {
            year: DateTime.now().year,
            month: dt.month,
            day: dt.day,
            hour: dt.hour,
            minute: dt.minute,
          },
          { zone: tzDoc.identifier },
        );

        user.birthDate = dt.toUTC().toJSDate();
        user.nextBirthWish = next.toUTC().toJSDate();
      }

      const updated = await user.save();
      return updated.populate<{ timezone: Timezone }>('timezone');
    } catch (e) {
      if (e.name == 'CastError') {
        throw new BadRequestException(`${id} is not a valid ObjectID`);
      } else {
        throw new BadRequestException(e);
      }
    }
  }

  async findAllByEmail(email: string): Promise<User[]> {
    if (email === null) {
      throw new BadRequestException('User ID cannot be null');
    }

    const users = await this.userModel
      .find({ email: email })
      .populate<{ timezone: Timezone }>('timezone')
      .exec();
    if (!users || users.length == 0) {
      throw new NotFoundException(`Users by email ${email} not found`);
    }
    return users;
  }

  async findOneById(id: string): Promise<User> {
    if (id === null) {
      throw new BadRequestException('User ID cannot be null');
    }

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
      if (e.name == 'CastError') {
        throw new BadRequestException(`${id} is not a valid ObjectID`);
      } else {
        throw new BadRequestException(e);
      }
    }
  }

  async remove(id: string): Promise<void> {
    if (id === null) {
      throw new BadRequestException('User ID cannot be null');
    }

    try {
      const res = await this.userModel.deleteOne({ _id: id }).exec();
      if (res.deletedCount === 0) {
        throw new NotFoundException(`User ${id} not found`);
      }
    } catch (e) {
      if (e.name == 'CastError') {
        throw new BadRequestException(`${id} is not a valid ObjectID`);
      } else {
        throw new BadRequestException(e);
      }
    }
  }
}
