'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useMobile } from '@/hooks/useMobile'

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
}

export default function FloatingActionButton({ 
  onClick, 
  className = '' 
}: FloatingActionButtonProps) {
  const { isMobile } = useMobile()

  if (!isMobile) return null

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center touch-target ${className}`}
      aria-label="New conversation"
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  )
}
