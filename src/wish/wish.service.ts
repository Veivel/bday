import { Inject, Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { User, UserDocument } from 'src/Users/schemas/user.schema';
import { DateTime, Duration } from 'luxon';
import { Timezone } from 'src/timezones/schemas/timezones.schema';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class WishService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
    private configService: ConfigService,
  ) {}

  async checkForBirthdays() {
    console.log('Cron job is running, checking for birthdays!');
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

    // check if now.utc == birthday.utc + local_time_to_send, send birthday

    console.log(`Found ${users.length} users within delta...`);
    const resend = new Resend(this.configService.get('RESEND_API_KEY'));

    users.forEach(async (user) => {
      const nextBirthWishDate: luxon.DateTime = DateTime.fromISO(
        user.nextBirthWish.toISOString(),
      ).toUTC();
      const diff = nowDate.diff(nextBirthWishDate).as('hours');
      console.log(diff, user.timezone.identifier, user.timezone.utcOffset);
      if (diff > 9 && diff < 10.1) {
        const { data, error } = await resend.emails.send({
          from: 'hello@testmail.veivelp.com',
          to: user.email,
          subject: 'Happy Birthday!',
          html: `<p>Happy birthday <strong>${user.name}</strong>!</p>`,
        });
        if (error) {
          console.error({ error });
          return;
        } else {
          console.log(`Successfully sent mail to ${user.email}`);
        }

        const newNextBirthWishDate = nextBirthWishDate.plus(
          Duration.fromObject({ years: 1 }),
        );
        const res = await user
          .$set({
            nextBirthWish: newNextBirthWishDate.toISO(),
          })
          .save();
        console.log(res);
      }
    });
  }
}
