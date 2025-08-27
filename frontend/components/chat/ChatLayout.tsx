"use client";

import { useState, useEffect } from "react";
import { conversationsApi } from "@/lib/api";
import { socketManager } from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import toast from "react-hot-toast";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

interface Message {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  createdAt: string;
  conversationId: string;
}

export default function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
    initializeSocket();

    return () => {
      socketManager.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
      socketManager.joinConversation(currentConversation.id);

      return () => {
        socketManager.leaveConversation(currentConversation.id);
      };
    }
  }, [currentConversation]);

  const initializeSocket = () => {
    try {
      socketManager.connect();

      socketManager.onNewMessage((message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      socketManager.onAIResponseStart(() => {
        // Handle AI response start if needed
      });

      socketManager.onAIResponseEnd(() => {
        // Handle AI response end if needed
      });

      // Listen for conversation title updates
      socketManager
        .getSocket()
        ?.on(
          "conversation-updated",
          (data: { conversationId: string; title: string }) => {
            console.log("Conversation updated:", data);

            // Update conversations list
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === data.conversationId
                  ? { ...conv, title: data.title }
                  : conv
              )
            );

            // Update current conversation if it's the same one
            if (currentConversation?.id === data.conversationId) {
              setCurrentConversation((prev) =>
                prev ? { ...prev, title: data.title } : null
              );
            }
          }
        );
    } catch (error) {
      console.error("Failed to initialize socket:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await conversationsApi.getAll();
      setConversations(response.data);
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await conversationsApi.getById(conversationId);
      setMessages(response.data.messages || []);
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await conversationsApi.create({
        title: "New Conversation",
      });
      const newConversation = response.data;
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
    } catch (error) {
      toast.error("Failed to create conversation");
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await conversationsApi.delete(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const sendMessage = (content: string) => {
    console.log("sendMessage called with:", content);
    console.log("currentConversation:", currentConversation);

    if (!currentConversation) {
      console.log("No current conversation!");
      return;
    }

    console.log("Sending via socket to conversation:", currentConversation.id);
    socketManager.sendMessage(currentConversation.id, content);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-chat-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chat-text"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-chat-bg">
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={setCurrentConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <ChatArea
        conversation={currentConversation}
        messages={messages}
        onSendMessage={sendMessage}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}
