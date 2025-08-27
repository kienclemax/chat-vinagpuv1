"use client";

import { useState, useRef, useEffect } from "react";
import { Bars3Icon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import MessageList from "./MessageList";
import { socketManager } from "@/lib/socket";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  createdAt: string;
  conversationId: string;
}

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ChatArea({
  conversation,
  messages,
  onSendMessage,
  sidebarOpen,
  onToggleSidebar,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponding, setAiResponding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (conversation) {
      // Listen for AI response events
      socketManager.onAIResponseStart(() => {
        setAiResponding(true);
      });

      socketManager.onAIResponseEnd(() => {
        setAiResponding(false);
      });

      return () => {
        socketManager.off("ai-response-start");
        socketManager.off("ai-response-end");
      };
    }
  }, [conversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !conversation || aiResponding) return;

    console.log("Sending message:", inputValue.trim());
    console.log("Conversation:", conversation);
    onSendMessage(inputValue.trim());
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }

    // Handle typing indicators
    if (conversation) {
      if (!isTyping) {
        setIsTyping(true);
        socketManager.startTyping(conversation.id);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketManager.stopTyping(conversation.id);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-chat-border bg-chat-bg">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-chat-text hover:bg-chat-input rounded-md touch-target"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-chat-text truncate mx-4">
            {conversation?.title || "Chat.VinaGPU.com"}
          </h1>
          <div className="w-10" /> {/* Spacer for mobile */}
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-chat-text mb-4">
              Welcome to Chat.VinaGPU.com
            </h2>
            <p className="text-chat-text-secondary mb-8 max-w-md">
              Start a new conversation to begin chatting with AI. Your
              conversations will appear in the sidebar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="p-4 border border-chat-border rounded-lg">
                <h3 className="font-semibold text-chat-text mb-2">
                  💡 Examples
                </h3>
                <ul className="text-sm text-chat-text-secondary space-y-1">
                  <li>"Explain quantum computing"</li>
                  <li>"Write a Python function"</li>
                  <li>"Plan a trip to Japan"</li>
                </ul>
              </div>
              <div className="p-4 border border-chat-border rounded-lg">
                <h3 className="font-semibold text-chat-text mb-2">
                  ⚡ Capabilities
                </h3>
                <ul className="text-sm text-chat-text-secondary space-y-1">
                  <li>Real-time responses</li>
                  <li>Code generation</li>
                  <li>Creative writing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col chat-layout">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-chat-border bg-chat-bg">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-chat-text hover:bg-chat-input rounded-md"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-chat-text truncate">
          {conversation.title}
        </h1>
        <div className="w-9 lg:hidden" /> {/* Spacer for mobile */}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden h-0 chat-messages-wrapper">
        <MessageList messages={messages} aiResponding={aiResponding} />
      </div>

      {/* Input */}
      <div className="border-t border-chat-border bg-chat-bg p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  aiResponding ? "AI is responding..." : "Type your message..."
                }
                disabled={aiResponding}
                className="w-full px-4 py-3 pr-12 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                rows={1}
                style={{ minHeight: "52px", maxHeight: "200px" }}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || aiResponding}
                className="absolute right-3 bottom-3 p-2 text-chat-text-secondary hover:text-chat-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-chat-text-secondary mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
