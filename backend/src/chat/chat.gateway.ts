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
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { UsersService } from '../users/users.service';
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

    try {
      // Extract token from query params (sent by frontend)
      const token = client.handshake.query?.token as string;

      if (!token) {
        console.log('No token provided, using fallback user');
        // Fallback for testing
        client.user = {
          id: 'cmeto73d6000ir33i3o2cz9do',
          email: 'toan@onet.vn',
          username: 'toan@onet.vn',
        };
        return;
      }

      // Decode JWT token to get user info
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('JWT payload:', payload);

      client.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };

      console.log(`User ${client.user.username} connected via WebSocket`);
    } catch (error) {
      console.log('Token decode failed, using fallback:', error.message);
      // Fallback user
      client.user = {
        id: 'cmeto73d6000ir33i3o2cz9do',
        email: 'toan@onet.vn',
        username: 'toan@onet.vn',
      };
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    console.log('join-conversation called:', data);
    console.log('client.user:', client.user);

    if (!client.user) {
      console.log('No user attached to client');
      return;
    }

    try {
      // Verify user has access to conversation
      console.log('Checking conversation access for user:', client.user.id, 'conversation:', data.conversationId);
      await this.conversationsService.findOne(data.conversationId, client.user.id);

      // Join the conversation room
      client.join(`conversation-${data.conversationId}`);
      console.log('User joined conversation room:', data.conversationId);

      client.emit('joined-conversation', { conversationId: data.conversationId });
    } catch (error) {
      console.log('Failed to join conversation:', error.message);
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

      // Auto-generate title if this is the first user message
      if (messages.filter(m => m.role === Role.USER).length === 1) {
        try {
          const newTitle = await this.conversationsService.generateTitle(data.conversationId, client.user.id);
          await this.conversationsService.update(data.conversationId, client.user.id, { title: newTitle });

          // Broadcast title update
          this.server.to(`conversation-${data.conversationId}`).emit('conversation-updated', {
            conversationId: data.conversationId,
            title: newTitle
          });
        } catch (error) {
          console.log('Failed to generate title:', error.message);
        }
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
