import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { AppModule } from '../src/app.module';
import { TimezonesService } from '../src/timezones/timezones.service';
import { CreateTimezoneDto } from '../src/timezones/dto/create-timezone.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tzService = app.get(TimezonesService);

  const filePath = path.resolve(__dirname, './timezones.csv');
  const rows: CreateTimezoneDto[] = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      // assume CSV headers: identifier,utcOffset,abbreviation
      rows.push({
        identifier: data.identifier,
        utcOffset: data.utcOffset,
        abbreviation: data.abbreviation,
      });
    })
    .on('end', async () => {
      console.log(`Seeding ${rows.length} timezones…`);
      for (const dto of rows) {
        try {
          await tzService.create(dto);
        } catch (e) {
          console.warn(`  ✗ ${dto.identifier}: ${e.message}`);
        }
      }
      console.log('Done.');
      await app.close();
    });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
