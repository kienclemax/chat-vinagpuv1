import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
