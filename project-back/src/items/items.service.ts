import { Injectable, NotFoundException } from '@nestjs/common';
import { Item } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { UPLOAD_PATH } from '../config/multer.config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, UpdateItemDto } from './dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createItemDto: CreateItemDto,
    file?: Express.Multer.File,
  ): Promise<Item> {
    const data: any = { ...createItemDto };

    if (file) {
      data.imagePath = file.filename;
      data.imageMime = file.mimetype;
    }

    return await this.prisma.item.create({
      data,
    });
  }

  async findAll(): Promise<Item[]> {
    return await this.prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }

    return item;
  }

  async findOneRaw(id: string): Promise<Item | null> {
    return await this.prisma.item.findUnique({
      where: { id },
    });
  }

  async findByCategory(category: string): Promise<Item[]> {
    return await this.prisma.item.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    file?: Express.Multer.File,
  ): Promise<Item> {
    const existingItem = await this.findOne(id);

    const data: any = { ...updateItemDto };

    if (file) {
      const oldImagePath = existingItem.imagePath;
      if (oldImagePath) {
        const oldFilePath = join(UPLOAD_PATH, oldImagePath);
        if (existsSync(oldFilePath)) {
          unlinkSync(oldFilePath);
        }
      }

      data.imagePath = file.filename;
      data.imageMime = file.mimetype;
    }

    return await this.prisma.item.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Item> {
    const item = await this.findOne(id);

    const imagePath = item.imagePath;
    if (imagePath) {
      const filePath = join(UPLOAD_PATH, imagePath);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    return await this.prisma.item.delete({
      where: { id },
    });
  }
}
