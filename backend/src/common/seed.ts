import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Seeding...');

  // await dataSource.initialize();

  try {
    logger.log('Legacy grocery catalog seeding has been removed.');
    logger.log('No seed operations are configured for the current phase.');
  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    // await dataSource.destroy();
  }
}

void bootstrap();
