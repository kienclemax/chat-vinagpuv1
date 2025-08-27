"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  UserIcon,
  CpuChipIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  createdAt: string;
  conversationId: string;
}

interface MessageListProps {
  messages: Message[];
  aiResponding: boolean;
}

export default function MessageList({
  messages,
  aiResponding,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setUserScrolled(false);
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50;

      setIsAtBottom(isBottom);
      setShowScrollButton(!isBottom && messages.length > 10);

      if (!isBottom) {
        setUserScrolled(true);

        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Reset user scrolled after 3 seconds of no scrolling
        scrollTimeoutRef.current = setTimeout(() => {
          setUserScrolled(false);
        }, 3000);
      }
    },
    [messages.length]
  );

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled or is at bottom
    if (!userScrolled && isAtBottom) {
      scrollToBottom();
    }
  }, [messages, aiResponding, userScrolled, isAtBottom, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-2 p-4">
      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
        <CpuChipIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex gap-1">
        <div className="typing-indicator"></div>
        <div className="typing-indicator"></div>
        <div className="typing-indicator"></div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 relative">
      <div
        ref={messagesContainerRef}
        className="h-full overflow-y-auto scroll-smooth"
        onScroll={handleScroll}
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !aiResponding ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-chat-text-secondary">
                <CpuChipIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation by typing a message below</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`group relative ${
                    message.role === "USER"
                      ? "bg-chat-bg"
                      : "bg-chat-input bg-opacity-50"
                  }`}
                >
                  <div className="flex gap-4 p-6 max-w-4xl mx-auto">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "USER"
                            ? "bg-blue-600"
                            : "bg-green-600"
                        }`}
                      >
                        {message.role === "USER" ? (
                          <UserIcon className="w-5 h-5 text-white" />
                        ) : (
                          <CpuChipIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-chat-text">
                          {message.role === "USER" ? "You" : "Assistant"}
                        </span>
                        <span className="text-xs text-chat-text-secondary">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>

                      <div className="prose prose-invert max-w-none">
                        {message.role === "USER" ? (
                          <p className="text-chat-text whitespace-pre-wrap">
                            {message.content}
                          </p>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="text-chat-text"
                            components={{
                              code({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                              }: any) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-md"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ children }) => (
                                <p className="mb-4 last:mb-0 text-chat-text">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-4 text-chat-text">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-4 text-chat-text">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1 text-chat-text">
                                  {children}
                                </li>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold mb-4 text-chat-text">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-bold mb-3 text-chat-text">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-bold mb-2 text-chat-text">
                                  {children}
                                </h3>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-chat-border pl-4 italic mb-4 text-chat-text-secondary">
                                  {children}
                                </blockquote>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto mb-4">
                                  <table className="min-w-full border border-chat-border">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="border border-chat-border px-4 py-2 bg-chat-input text-chat-text font-semibold">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-chat-border px-4 py-2 text-chat-text">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {aiResponding && (
                <div className="bg-chat-input bg-opacity-50">
                  <div className="max-w-4xl mx-auto">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
          title="Scroll to bottom"
        >
          <ChevronDownIcon className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">New messages</span>
        </button>
      )}
    </div>
  );
}
