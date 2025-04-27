import { Controller } from '@nestjs/common';
import { WishService } from './wish.service';
import { Cron } from '@nestjs/schedule';

@Controller('wish')
export class WishController {
  constructor(private readonly wishService: WishService) {}

  @Cron('0 15 * * * *') /** runs every hour at minute 15 */
  // @Cron('*/10 * * * * *') /** runs every 10 seconds, for development only */
  handleHourlyCron() {
    this.wishService.checkForBirthdays();
  }
}
