'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null)
  const { user, logout } = useAuth()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative lg:translate-x-0 z-50 flex flex-col w-80 bg-chat-sidebar border-r border-chat-border transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-chat-border">
          <button
            onClick={onNewConversation}
            className="flex items-center gap-2 px-3 py-2 text-sm text-chat-text bg-chat-input border border-chat-border rounded-md hover:bg-opacity-80 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Chat
          </button>
          
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-chat-text hover:bg-chat-input rounded-md"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-chat-text-secondary">
              <ChatBubbleLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversation?.id === conversation.id
                      ? 'bg-chat-input'
                      : 'hover:bg-chat-input hover:bg-opacity-50'
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                >
                  <ChatBubbleLeftIcon className="w-5 h-5 text-chat-text-secondary flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-chat-text truncate">
                      {truncateTitle(conversation.title)}
                    </p>
                    <p className="text-xs text-chat-text-secondary">
                      {formatDate(conversation.updatedAt)}
                    </p>
                  </div>

                  {(hoveredConversation === conversation.id || currentConversation?.id === conversation.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                      className="p-1 text-chat-text-secondary hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="border-t border-chat-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-chat-input rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-chat-text-secondary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-chat-text truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username}
              </p>
              <p className="text-xs text-chat-text-secondary truncate">
                {user?.email}
              </p>
            </div>

            <button
              onClick={logout}
              className="p-2 text-chat-text-secondary hover:text-chat-text transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
