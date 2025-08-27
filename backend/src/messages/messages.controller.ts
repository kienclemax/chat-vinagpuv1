import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(req.user.id, createMessageDto);
  }

  @Get('conversation/:conversationId')
  findByConversation(@Param('conversationId') conversationId: string, @Request() req) {
    return this.messagesService.findByConversation(conversationId, req.user.id);
  }

  @Post('conversation/:conversationId/ai-response')
  generateAIResponse(@Param('conversationId') conversationId: string, @Request() req) {
    return this.messagesService.generateAIResponse(conversationId, req.user.id);
  }

  @Post('conversation/:conversationId/ai-response-stream')
  async generateAIResponseStream(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      for await (const chunk of this.messagesService.generateAIResponseStream(
        conversationId,
        req.user.id,
      )) {
        res.write(chunk);
      }
      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate AI response' });
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.id);
  }
}
