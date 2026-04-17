import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar cidadao (publico)' })
  create(@Body() dto: CreateUserDto) { return this.svc.create(dto); }

  @Get('me')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Perfil do usuario autenticado' })
  getProfile(@Req() req: any) { return this.svc.findById(req.user.sub); }

  @Patch('me')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) { return this.svc.update(req.user.sub, dto); }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin') @ApiBearerAuth('access-token')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
}
