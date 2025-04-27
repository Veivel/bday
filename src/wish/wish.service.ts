import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { DateTime, Duration } from 'luxon';
import { Timezone } from '@/timezones/schemas/timezones.schema';
import { ConfigService } from '@nestjs/config';
import { CreateEmailResponseSuccess, Resend } from 'resend';
import { User, UserDocument } from '@/users/schemas/user.schema';

@Injectable()
export class WishService {
  private readonly logger = new Logger(WishService.name);
  private resend = new Resend(this.configService.get('RESEND_API_KEY'));
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async sendEmail(user: User): Promise<CreateEmailResponseSuccess | null> {
    const { data, error } = await this.resend.emails.send({
      from: 'hello@testmail.veivelp.com',
      to: user.email,
      subject: 'Happy Birthday!',
      html: `<p>Happy birthday <strong>${user.name}</strong>!</p>`,
    });
    if (error) {
      this.logger.error({ error });
      return null;
    } else {
      this.logger.log(`Successfully sent email to ${user.email}`);
      return data;
    }
  }

  async checkForBirthdays() {
    this.logger.log('Cron job is running, checking for birthdays!');
    const delta: luxon.Duration = Duration.fromObject({ days: 3 });
    const nowDate: luxon.DateTime = DateTime.now().toUTC();

    const users = await this.userModel
      .find()
      .populate<{ timezone: Timezone }>('timezone')
      .find({
        nextBirthWish: {
          $gte: nowDate.minus(delta).toISO(),
          $lte: nowDate.plus(delta).toISO(),
        },
      })
      .exec();
    this.logger.debug(`Found ${users.length} users within delta...`);

    // check if now.utc == birthday.utc + 9 hours, send birthday
    users.forEach(async (user) => {
      const nextBirthWishDate: luxon.DateTime = DateTime.fromISO(
        user.nextBirthWish.toISOString(),
      ).toUTC();
      const diff = nowDate.diff(nextBirthWishDate).as('hours');
      this.logger.debug(
        diff,
        user.timezone.identifier,
        user.timezone.utcOffset,
      );
      if (diff > 9 && diff < 10) {
        this.sendEmail(user);

        const newNextBirthWishDate = nextBirthWishDate.plus(
          Duration.fromObject({ years: 1 }),
        );
        const res = await user
          .$set({
            nextBirthWish: newNextBirthWishDate.toISO(),
          })
          .save();
        this.logger.debug(res);
      }
    });
  }
}
