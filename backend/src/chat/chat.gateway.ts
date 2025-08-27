import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { Role } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.user) return;

    try {
      // Verify user has access to conversation
      await this.conversationsService.findOne(data.conversationId, client.user.id);
      
      // Join the conversation room
      client.join(`conversation-${data.conversationId}`);
      
      client.emit('joined-conversation', { conversationId: data.conversationId });
    } catch (error) {
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation-${data.conversationId}`);
    client.emit('left-conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!client.user) return;

    try {
      // Create user message
      const userMessage = await this.messagesService.create(client.user.id, {
        content: data.content,
        role: Role.USER,
        conversationId: data.conversationId,
      });

      // Broadcast user message to conversation room
      this.server.to(`conversation-${data.conversationId}`).emit('new-message', userMessage);

      // Generate AI response with streaming
      client.emit('ai-response-start', { conversationId: data.conversationId });

      let fullAIResponse = '';
      for await (const chunk of this.messagesService.generateAIResponseStream(
        data.conversationId,
        client.user.id,
      )) {
        fullAIResponse += chunk;
        client.emit('ai-response-chunk', { 
          conversationId: data.conversationId, 
          chunk 
        });
      }

      // Notify that AI response is complete
      client.emit('ai-response-end', { 
        conversationId: data.conversationId,
        fullResponse: fullAIResponse 
      });

      // Get the saved AI message and broadcast it
      const messages = await this.messagesService.findByConversation(
        data.conversationId,
        client.user.id,
      );
      const aiMessage = messages[messages.length - 1];
      
      if (aiMessage && aiMessage.role === Role.ASSISTANT) {
        this.server.to(`conversation-${data.conversationId}`).emit('new-message', aiMessage);
      }

    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.user) return;

    client.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: client.user.id,
      username: client.user.username,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.user) return;

    client.to(`conversation-${data.conversationId}`).emit('user-stopped-typing', {
      userId: client.user.id,
      conversationId: data.conversationId,
    });
  }
}
