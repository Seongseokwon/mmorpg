import { Injectable } from '@nestjs/common';
import { Prisma, type Save } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaveService {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string): Promise<Save | null> {
    return this.prisma.save.findUnique({ where: { userId } });
  }

  upsert(userId: string, version: number, data: Record<string, unknown>): Promise<Save> {
    const jsonData = data as Prisma.InputJsonValue;
    return this.prisma.save.upsert({
      where: { userId },
      create: { userId, version, data: jsonData },
      update: { version, data: jsonData },
    });
  }
}
