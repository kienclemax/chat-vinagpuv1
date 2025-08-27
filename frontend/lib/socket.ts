import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = Cookies.get("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      query: {
        token,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      this.isConnected = false;
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Chat-specific methods
  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("join-conversation", { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("leave-conversation", { conversationId });
    }
  }

  sendMessage(conversationId: string, content: string) {
    if (this.socket) {
      this.socket.emit("send-message", { conversationId, content });
    }
  }

  startTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit("typing-start", { conversationId });
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit("typing-stop", { conversationId });
    }
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("new-message", callback);
    }
  }

  onAIResponseStart(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("ai-response-start", callback);
    }
  }

  onAIResponseChunk(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("ai-response-chunk", callback);
    }
  }

  onAIResponseEnd(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("ai-response-end", callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("user-typing", callback);
    }
  }

  onUserStoppedTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("user-stopped-typing", callback);
    }
  }

  // Remove event listeners
  off(event: string, callback?: any) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;
