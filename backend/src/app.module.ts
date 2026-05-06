import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
// import { AuthModule } from './auth/auth.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WebhooksModule } from './webhooks/webhooks.module';

import { PrismaModule } from './prisma/prisma.module';
import { PosModule } from './pos/pos.module';
import { RestaurantModule } from './restaurant/restaurant.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? `.env.${ENV}` : '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // Default TTL is 1 hour
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 1 minute
        limit: 10, // 10 requests
      },
    ]),
    PrismaModule,
    // AuthModule,
    WhatsappModule,
    WebhooksModule,
    PosModule,
    RestaurantModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
