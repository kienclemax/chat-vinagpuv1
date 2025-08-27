# ChatGPT Clone

A full-stack ChatGPT clone built with modern technologies:

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Ollama API integration
- **Authentication**: JWT-based auth system

## Features

- 🤖 AI-powered chat conversations using Ollama
- 💬 Real-time messaging interface
- 👤 User authentication and session management
- 📝 Conversation history and persistence
- 🎨 Modern, responsive UI similar to ChatGPT
- 🔄 Streaming responses for better UX

## Project Structure

```
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
├── database/         # Database migrations and seeds
└── docker-compose.yml # Development environment setup
```

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Setup environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Ollama installed and running locally

## Environment Setup

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/chatgpt_clone"
JWT_SECRET="your-jwt-secret"
OLLAMA_BASE_URL="http://localhost:11434"
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Development

- Backend runs on port 3001
- Frontend runs on port 3000
- Database runs on port 5432

## License

MIT
# chat-vinagpuv1
