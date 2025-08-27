# Development Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Ollama (for AI responses)

## Quick Start

1. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Install and start Ollama**:
   ```bash
   # Install Ollama (macOS)
   brew install ollama
   
   # Start Ollama service
   ollama serve
   
   # Pull a model (in another terminal)
   ollama pull llama2
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Environment Setup
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend  
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your settings
```

### 3. Database Setup
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Setup database
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Services
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend  # Backend on :3001
npm run dev:frontend # Frontend on :3000
```

## Project Structure

```
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # User management
│   │   ├── conversations/ # Chat conversations
│   │   ├── messages/    # Chat messages
│   │   ├── ollama/      # AI integration
│   │   └── chat/        # WebSocket gateway
│   └── prisma/          # Database schema & migrations
├── frontend/            # Next.js web application
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities & API clients
└── database/           # Database initialization
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/validate` - Validate token

### Conversations
- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation with messages
- `PATCH /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages
- `POST /api/messages` - Create new message
- `GET /api/messages/conversation/:id` - Get conversation messages
- `POST /api/messages/conversation/:id/ai-response` - Generate AI response
- `DELETE /api/messages/:id` - Delete message

## WebSocket Events

### Client → Server
- `join-conversation` - Join conversation room
- `leave-conversation` - Leave conversation room
- `send-message` - Send new message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

### Server → Client
- `new-message` - New message received
- `ai-response-start` - AI started responding
- `ai-response-chunk` - AI response chunk (streaming)
- `ai-response-end` - AI finished responding
- `user-typing` - Another user is typing
- `user-stopped-typing` - User stopped typing

## Database Schema

### Users
- `id` - Unique identifier
- `email` - User email (unique)
- `username` - Username (unique)
- `password` - Hashed password
- `firstName`, `lastName` - Optional name fields
- `avatar` - Optional avatar URL

### Conversations
- `id` - Unique identifier
- `title` - Conversation title
- `userId` - Owner user ID
- `createdAt`, `updatedAt` - Timestamps

### Messages
- `id` - Unique identifier
- `content` - Message content
- `role` - USER | ASSISTANT | SYSTEM
- `conversationId` - Parent conversation
- `userId` - Message author
- `createdAt`, `updatedAt` - Timestamps

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatgpt_clone"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

## Troubleshooting

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && npx prisma migrate reset
```

### Ollama Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve

# List available models
ollama list
```

### Port Conflicts
- Backend: Change `PORT` in backend/.env
- Frontend: Use `npm run dev -- -p 3001` to change port
- Database: Change port mapping in docker-compose.yml

## Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests (when added)
cd frontend
npm run test
```

## Production Deployment

1. **Build applications**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Deploy database** (PostgreSQL)

4. **Deploy backend** (NestJS app)

5. **Deploy frontend** (Next.js app)

6. **Setup Ollama** on production server
