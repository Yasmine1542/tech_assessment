import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [MulterModule.register(multerConfig)],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
