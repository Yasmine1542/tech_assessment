import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedImagesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    name: string,
    file: Express.Multer.File,
    placedItems?: unknown[],
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const savedImage = await this.prisma.savedImage.create({
      data: {
        name: name || `Canvas - ${new Date().toLocaleDateString()}`,
        imagePath: `saved-images/${file.filename}`,
        placedItems: placedItems as Prisma.InputJsonValue,
        userId,
      },
    });

    return savedImage;
  }

  async findAllByUser(userId: string) {
    return await this.prisma.savedImage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const savedImage = await this.prisma.savedImage.findUnique({
      where: { id },
    });

    if (!savedImage) {
      throw new NotFoundException('Saved image not found');
    }

    if (savedImage.userId !== userId) {
      throw new ForbiddenException('You do not have access to this image');
    }

    return savedImage;
  }

  async remove(id: string, userId: string) {
    const savedImage = await this.findOne(id, userId);

    const imagePath = savedImage.imagePath as string;
    const filePath = join(process.cwd(), 'uploads', imagePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    await this.prisma.savedImage.delete({
      where: { id },
    });

    return { message: 'Image deleted successfully' };
  }
}
