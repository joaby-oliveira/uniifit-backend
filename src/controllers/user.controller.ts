import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Public } from 'src/constants/isPublic';
import { AuthDTO } from 'src/dto/auth.dto';
import { CreateUserDto } from 'src/dto/createUser.dto';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { UserService } from 'src/services/user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Post()
  async createUser(@Body() user: CreateUserDto) {
    try {
      const createdUser = await this.userService.createUser(user);

      return {
        message: 'Conta criada com sucesso',
        data: createdUser,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Não foi possível criar conta. (Dados duplicados)',
        );
      }
      throw new InternalServerErrorException(
        'Algum erro inesperado aconteceu, tente novamente mais tarde',
      );
    }
  }

  @Public()
  @Post('auth')
  async auth(@Body() login: AuthDTO) {
    try {
      const authResult = await this.userService.auth(login);

      return {
        message: 'Conta autenticada com sucesso',
        data: authResult,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Não foi possível se autenticar');
      } else {
        throw new InternalServerErrorException(
          'Algum erro inesperado aconteceu, tente novamente mais tarde',
        );
      }
    }
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async submitProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    try {
      return await this.userService.uploadProfilePicture(
        file,
        request['user'].sub ?? 0,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Algum erro inesperado aconteceu, tente novamente mais tarde',
      );
    }
  }

  @Get()
  async listUsers() {
    try {
      return await this.userService.listUsers();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Algum erro inesperado aconteceu, tente novamente mais tarde',
      );
    }
  }

  @Get(':id')
  async listUserById(@Param('id') id: number) {
    try {
      return await this.userService.listUserById(+id);
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException(
        'Algum erro inesperado aconteceu, tente novamente mais tarde',
      );
    }
  }

  @Put(':id')
  async updateUser(@Param('id') id: number, @Body() user: UpdateUserDto) {
    try {
      const updatedUser = await this.userService.updateUser(+id, user);

      return {
        message: 'Conta atualizada com sucesso',
        data: updatedUser,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Não foi possível atualizar conta. (Dados duplicados)',
        );
      }

      throw new InternalServerErrorException(
        'Algum erro inesperado aconteceu, tente novamente mais tarde',
      );
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    try {
      await this.userService.deleteUser(+id);

      return {
        message: 'Conta deletada com sucesso',
      };
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException(
        'Algum erro inesperado aconteceu, tente novamente mais tarde',
      );
    }
  }
}
