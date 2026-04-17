import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail ja cadastrado');
    const hashed = await bcrypt.hash(dto.password, 12);
    const saved = await this.repo.save(this.repo.create({ ...dto, password: hashed }));
    this.logger.log(`Usuario criado: ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} nao encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(id);
    return this.repo.save(Object.assign(user, dto));
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.update(id, { status: UserStatus.INACTIVE });
  }

  async findOrCreateFromKeycloak(keycloakId: string, data: Partial<UserEntity>): Promise<UserEntity> {
    let user = await this.repo.findOne({ where: { keycloakId } });
    if (!user) { user = await this.repo.save(this.repo.create({ ...data, keycloakId })); }
    return user;
  }
}
