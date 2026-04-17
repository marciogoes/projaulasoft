import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, Req, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatus } from './entities/request.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';

@ApiTags('requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles('cidadao')
  @ApiOperation({ summary: 'Criar novo pedido cartorial' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  async create(@Body() createRequestDto: CreateRequestDto, @Req() req: any) {
    return this.requestsService.create(req.user.sub, createRequestDto);
  }

  @Get()
  @Roles('cidadao', 'atendente', 'admin')
  @ApiOperation({ summary: 'Listar pedidos do cidadao' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async findAll(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.requestsService.findAllByCitizen(req.user.sub, page, limit);
  }

  @Get(':id')
  @Roles('cidadao', 'atendente', 'admin')
  @ApiOperation({ summary: 'Detalhes de um pedido' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.requestsService.findOne(id, req.user.sub);
  }

  @Patch(':id/status')
  @Roles('atendente', 'admin')
  @ApiOperation({ summary: 'Atualizar status do pedido (atendente)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: RequestStatus,
    @Req() req: any,
  ) {
    return this.requestsService.updateStatus(id, req.user.sub, status);
  }
}
