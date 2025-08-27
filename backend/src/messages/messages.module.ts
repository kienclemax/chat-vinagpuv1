import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { OllamaModule } from '../ollama/ollama.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [OllamaModule, ConversationsModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
