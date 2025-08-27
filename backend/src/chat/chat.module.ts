import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [MessagesModule, ConversationsModule],
  providers: [ChatGateway],
})
export class ChatModule {}
