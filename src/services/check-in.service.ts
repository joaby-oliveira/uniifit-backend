import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { endOfDay, startOfDay } from 'date-fns';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class CheckInService {
  private readonly redis: Redis | null;

  constructor(
    private prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  public async createCheckIn(userId: number) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Verifica se o usuário já fez check-in hoje
    const existingCheckIn = await this.prismaService.checkIn.findFirst({
      where: {
        id_user: userId,
        createdAt: {
          gte: todayStart, // Maior ou igual ao início do dia
          lte: todayEnd, // Menor ou igual ao final do dia
        },
      },
    });

    // Se existir check-in no mesmo dia, lançar uma exceção
    if (existingCheckIn) {
      throw new BadRequestException('Você já realizou um check-in hoje.');
    }

    // Se não houver check-in, criar um novo
    return await this.prismaService.checkIn.create({
      data: {
        id_user: userId,
      },
    });
  }

  public async teste() {
    return await this.redis.set('key', 'value', 'EX', 10);
  }
}
