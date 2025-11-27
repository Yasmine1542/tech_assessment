import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavedImagesService } from './saved-images.service';

const SAVED_IMAGES_PATH = join(process.cwd(), 'uploads', 'saved-images');
if (!existsSync(SAVED_IMAGES_PATH)) {
  mkdirSync(SAVED_IMAGES_PATH, { recursive: true });
}

const savedImagesStorage = diskStorage({
  destination: SAVED_IMAGES_PATH,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname) || '.png';
    cb(null, `canvas-${uniqueSuffix}${ext}`);
  },
});

@Controller('saved-images')
@UseGuards(JwtAuthGuard)
export class SavedImagesController {
  constructor(private readonly savedImagesService: SavedImagesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: savedImagesStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(png|jpeg|jpg|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('placedItems') placedItemsJson?: string,
  ) {
    let placedItems: unknown[] | undefined;
    if (placedItemsJson) {
      try {
        placedItems = JSON.parse(placedItemsJson);
      } catch {}
    }
    return this.savedImagesService.create(user.id, name, file, placedItems);
  }

  @Get()
  async findAll(@CurrentUser() user: { id: string }) {
    return this.savedImagesService.findAllByUser(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.savedImagesService.findOne(id, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.savedImagesService.remove(id, user.id);
  }
}
