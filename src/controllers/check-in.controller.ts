import {
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckInService } from 'src/services/check-in.service';
import { UserService } from 'src/services/user.service';

@Controller('checkin')
export class CheckInController {
  constructor(
    private checkInService: CheckInService,
    private userService: UserService,
  ) {}

  @Post()
  async userCheckIn(@Req() request: Request) {
    try {
      const userId = request['user'].sub ?? 0;
      const checkIn = await this.checkInService.createCheckIn(userId);

      return {
        message: 'Check-in realizado com sucesso',
        data: checkIn,
      };
    } catch (error) {
      if (error.status === 400) {
        return {
          message: error.message,
        };
      }
      throw new InternalServerErrorException(
        'Erro ao realizar o check-in, tente novamente mais tarde.',
      );
    }
  }

  // Lista de usuários baseados no status do último check-in
  @Get('status')
  async listUsersByCheckInStatus() {
    try {
      const users = await this.userService.getUsersByCheckInStatus();

      return {
        message: 'Usuários listados com sucesso',
        data: users,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Erro ao listar usuários, tente novamente mais tarde.',
      );
    }
  }

  @Post('qrcode')
  async getQrCode() {
    return await this.checkInService.getQrCode();
  }

  @Post('confirm')
  async confirm(
    @Query('encodedQrCode') encodedQrCode: string,
    @Query('checkInId') checkInId: string,
  ) {
    return await this.checkInService.confirmCheckin(encodedQrCode, +checkInId);
  }

  @Get()
  async getAllMonthCheckIns() {
    try {
      const checkInList = await this.checkInService.getAllMonthCheckIns();

      return {
        message: 'Check-in listados com sucesso',
        data: checkInList,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Erro ao obter os check-in anteriores.',
      );
    }
  }

  @Get('streak/:id')
  async getStreakCheckIn(@Param('id') userId: number) {
    try {
      const streak = await this.checkInService.getStreak(+userId);

      return {
        message: 'Streak de Check-in listados com sucesso',
        data: streak,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Erro ao obter os check-in anteriores.',
      );
    }
  }

  @Get('idle/:id')
  async getIdleStreakCheckIn(@Param('id') userId: number) {
    try {
      const streak = await this.checkInService.getIdleStreak(+userId);

      return {
        message: 'Streak de ociosidade listada com sucesso',
        data: streak,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Erro ao obter os check-in anteriores.',
      );
    }
  }
}
