import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import {
  endOfDay,
  startOfDay,
  subDays,
  differenceInDays,
  addDays,
  isSaturday,
  isSunday,
} from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  public async getAllMonthCheckIns() {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const records = await this.prismaService.checkIn.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    return records;
  }

  public async getStreak(userId: number) {
    let streak = 0;
    let daysMinus = 0;
    while (true) {
      const todayStart = startOfDay(subDays(new Date(), daysMinus));
      const todayEnd = endOfDay(subDays(new Date(), daysMinus));

      const existingCheckIn = await this.prismaService.checkIn.findFirst({
        where: {
          id_user: userId,
          createdAt: {
            gte: todayStart, // Maior ou igual ao início do dia
            lte: todayEnd, // Menor ou igual ao final do dia
          },
        },
      });

      daysMinus++;

      if (daysMinus == 1 && !existingCheckIn) continue;

      if (!existingCheckIn) break;

      streak++;
    }

    return streak;
  }

  public async getIdleStreak(userId: number) {
    const lastCheckIn = await this.prismaService.checkIn.findFirst({
      where: {
        id_user: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastCheckIn) {
      return null;
    }

    const lastCheckInDate = startOfDay(lastCheckIn.createdAt);
    const today = startOfDay(new Date());

    let missedDays = 0;
    let currentDate = addDays(lastCheckInDate, 1); // Começa no dia após o último check-in

    while (differenceInDays(today, currentDate) > 0) {
      // Ignora sábados e domingos
      if (!isSaturday(currentDate) && !isSunday(currentDate)) {
        missedDays++;
      }
      currentDate = addDays(currentDate, 1); // Incrementa um dia
    }

    return missedDays;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    const users = await this.prismaService.user.findMany({
      where: {
        status: 'approved',
        role: 'USER',
      },
    });

    for (const user of users) {
      const idleStreak = await this.getIdleStreak(user.id);

      if (idleStreak > 7) {
        this.prismaService.user.update({
          data: {
            status: 'inactive',
          },
          where: {
            id: user.id,
          },
        });
      }
    }
  }
}
