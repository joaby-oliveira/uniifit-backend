import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
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
}
