import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.model = this.configService.get<string>('OLLAMA_MODEL') || 'llama2';
  }

  async generateResponse(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/chat`, {
        model: this.model,
        messages,
        stream: false,
      });

      return response.data.message.content;
    } catch (error) {
      this.logger.error('Error generating response from Ollama:', error.message);
      throw new Error('Failed to generate AI response');
    }
  }

  async *generateStreamResponse(messages: OllamaMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      let buffer = '';
      
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              if (data.message && data.message.content) {
                yield data.message.content;
              }
            } catch (parseError) {
              this.logger.warn('Failed to parse streaming response:', parseError.message);
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const data: OllamaResponse = JSON.parse(buffer);
          if (data.message && data.message.content) {
            yield data.message.content;
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse final streaming response:', parseError.message);
        }
      }
    } catch (error) {
      this.logger.error('Error generating streaming response from Ollama:', error.message);
      throw new Error('Failed to generate AI response');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.status === 200;
    } catch (error) {
      this.logger.error('Ollama health check failed:', error.message);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      this.logger.error('Error listing Ollama models:', error.message);
      return [];
    }
  }
}
