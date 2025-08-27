'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ChatLayout from '@/components/chat/ChatLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-chat-bg">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <ChatLayout />
}
