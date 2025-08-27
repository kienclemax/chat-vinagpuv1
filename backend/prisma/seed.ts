import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo user
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo_user',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create a sample conversation
  const conversation = await prisma.conversation.create({
    data: {
      title: 'Welcome to ChatGPT Clone',
      userId: user.id,
    },
  })

  // Create sample messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Hello! Welcome to ChatGPT Clone. How can I help you today?',
        role: 'ASSISTANT',
        conversationId: conversation.id,
        userId: user.id,
      },
      {
        content: 'This is a demo conversation to show how the chat interface works.',
        role: 'ASSISTANT',
        conversationId: conversation.id,
        userId: user.id,
      },
    ],
  })

  console.log('✅ Created sample conversation and messages')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
