import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { PosSyncService } from '../pos-sync.service';

/** Runs the manual POS sync command. */
async function bootstrap(): Promise<void> {
  const logger = new Logger('SyncPosMvp');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const result = await app.get(PosSyncService).syncAll();
    logger.log(`Synced ${result.menuItems} menu items`);
    logger.log(`Synced ${result.deliveryServices} delivery services`);
  } finally {
    await app.close();
  }
}

void bootstrap();
