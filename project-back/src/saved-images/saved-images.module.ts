import { Module } from '@nestjs/common';
import { SavedImagesController } from './saved-images.controller';
import { SavedImagesService } from './saved-images.service';

@Module({
  controllers: [SavedImagesController],
  providers: [SavedImagesService],
  exports: [SavedImagesService],
})
export class SavedImagesModule {}
