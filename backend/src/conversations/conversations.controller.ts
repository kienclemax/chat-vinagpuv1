import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Request() req, @Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(req.user.id, createConversationDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.conversationsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, req.user.id, updateConversationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.conversationsService.remove(id, req.user.id);
  }

  @Post(':id/generate-title')
  generateTitle(@Param('id') id: string, @Request() req) {
    return this.conversationsService.generateTitle(id, req.user.id);
  }
}
