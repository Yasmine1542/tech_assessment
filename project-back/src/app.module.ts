import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { SavedImagesModule } from './saved-images/saved-images.module';

@Module({
  imports: [HealthModule, PrismaModule, ItemsModule, AuthModule, SavedImagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
