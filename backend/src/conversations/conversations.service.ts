import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createConversationDto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        ...createConversationDto,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only get the last message for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    return conversation;
  }

  async update(id: string, userId: string, updateConversationDto: UpdateConversationDto) {
    const conversation = await this.findOne(id, userId);

    return this.prisma.conversation.update({
      where: { id },
      data: updateConversationDto,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check ownership

    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async generateTitle(conversationId: string, userId: string): Promise<string> {
    const conversation = await this.findOne(conversationId, userId);

    if (conversation.messages.length === 0) {
      return 'New Conversation';
    }

    // Get the first user message to generate a title
    const firstUserMessage = conversation.messages.find(msg => msg.role === 'USER');
    if (!firstUserMessage) {
      return 'New Conversation';
    }

    // Smart title generation
    let content = firstUserMessage.content.trim();

    // Remove common question words and clean up
    content = content.replace(/^(what|how|why|when|where|who|can you|could you|please|help me|i want to|i need to)\s+/i, '');

    // Take first meaningful words (max 5-6 words)
    const words = content.split(' ').slice(0, 5);
    let title = words.join(' ');

    // Add ellipsis if content is longer
    if (content.split(' ').length > 5) {
      title += '...';
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Fallback if title is too short
    if (title.length < 3) {
      title = 'Chat about ' + firstUserMessage.content.split(' ').slice(0, 3).join(' ');
    }

    return title;
  }
}
