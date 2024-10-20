import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class CheckInService {
  constructor(private prismaService: PrismaService) {}

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
}
