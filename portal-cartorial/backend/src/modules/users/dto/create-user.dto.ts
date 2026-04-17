import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Joao da Silva' })
  @IsString() @MinLength(3)
  fullName: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '000.000.000-00' })
  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF no formato 000.000.000-00' })
  cpf?: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString() @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, { message: 'Senha deve ter maiuscula, minuscula e numero' })
  password: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phone?: string;
}
