import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService, OllamaMessage } from '../ollama/ollama.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Role } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private ollamaService: OllamaService,
    private conversationsService: ConversationsService,
  ) {}

  async create(userId: string, createMessageDto: CreateMessageDto) {
    // Verify conversation exists and user has access
    await this.conversationsService.findOne(createMessageDto.conversationId, userId);

    return this.prisma.message.create({
      data: {
        ...createMessageDto,
        userId,
      },
    });
  }

  async findByConversation(conversationId: string, userId: string) {
    // Verify conversation exists and user has access
    await this.conversationsService.findOne(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async generateAIResponse(conversationId: string, userId: string): Promise<string> {
    // Get conversation messages
    const messages = await this.findByConversation(conversationId, userId);
    
    // Convert to Ollama format
    const ollamaMessages: OllamaMessage[] = messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Generate response
    const response = await this.ollamaService.generateResponse(ollamaMessages);

    // Save AI response
    await this.create(userId, {
      content: response,
      role: Role.ASSISTANT,
      conversationId,
    });

    return response;
  }

  async *generateAIResponseStream(conversationId: string, userId: string): AsyncGenerator<string, void, unknown> {
    // Get conversation messages
    const messages = await this.findByConversation(conversationId, userId);
    
    // Convert to Ollama format
    const ollamaMessages: OllamaMessage[] = messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    let fullResponse = '';

    // Generate streaming response
    for await (const chunk of this.ollamaService.generateStreamResponse(ollamaMessages)) {
      fullResponse += chunk;
      yield chunk;
    }

    // Save complete AI response
    if (fullResponse) {
      await this.create(userId, {
        content: fullResponse,
        role: Role.ASSISTANT,
        conversationId,
      });
    }
  }

  async remove(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { conversation: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.message.delete({
      where: { id },
    });
  }
}
