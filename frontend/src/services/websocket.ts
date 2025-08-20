// websocket.service.ts
type Listener = (data: any) => void;
type WSState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();

  // Reconnect handling
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private baseReconnectDelay = 1000;
  private manualClose = false;

  // Heartbeat
  private heartbeatIntervalMs = 15000;
  private heartbeatTimeoutMs = 12000;
  private heartbeatTimer: any = null;
  private pongTimeout: any = null;

  // Message queue (for offline sends)
  private messageQueue: Array<{ type: string; data: any }> = [];
  private maxQueueSize = 100;

  // State tracking
  private state: WSState = "idle";
  private lastConnectedAt: number | null = null;
  private lastDisconnectedAt: number | null = null;

  // Debug logging toggle
  private debug = true;

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.manualClose = false;
    this.state = "connecting";

    const token = localStorage.getItem("auth_token");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;

    if (this.debug) console.log("[WS] Connecting to:", url);

    this.socket = new WebSocket(url);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.state = "connected";
      this.reconnectAttempts = 0;
      this.lastConnectedAt = Date.now();
      this.emit("connection", { status: "connected" });
      if (this.debug) console.log("[WS] Connected");
      this.startHeartbeat();
      this.flushQueue();
    };

    this.socket.onclose = (ev) => {
      this.state = "disconnected";
      this.clearHeartbeat();
      this.lastDisconnectedAt = Date.now();
      this.emit("connection", { status: "disconnected", reason: ev.reason });

      if (this.debug)
        console.warn("[WS] Disconnected:", ev.reason || "no reason");

      if (!this.manualClose) this.handleReconnect();
    };

    this.socket.onerror = (ev) => {
      this.emit("connection", { status: "error", error: String(ev) });
      if (this.debug) console.error("[WS] Error:", ev);
      // Let onclose handle reconnection
    };

    this.socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const type = msg.type || "message";

        if (type === "pong") {
          if (this.debug) console.log("[WS] Pong received");
          if (this.pongTimeout) clearTimeout(this.pongTimeout);
          return;
        }

        this.emit(type, msg);
      } catch {
        if (this.debug) console.warn("[WS] Non-JSON message ignored:", ev.data);
      }
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WS] Max reconnection attempts reached");
      this.emit("connection", { status: "failed" });
      return;
    }

    this.reconnectAttempts++;
    const exp = Math.pow(2, this.reconnectAttempts - 1);
    const jitter = 300 + Math.random() * 300;
    const delay = this.baseReconnectDelay * exp + jitter;

    this.state = "reconnecting";
    if (this.debug)
      console.log(
        `[WS] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} after ${Math.round(
          delay
        )}ms`
      );

    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
      try {
        this.socket.send(JSON.stringify({ type: "ping", ts: Date.now() }));
        if (this.debug) console.log("[WS] Ping sent");

        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        this.pongTimeout = setTimeout(() => {
          console.warn("[WS] Pong timeout, closing socket");
          this.socket?.close();
        }, this.heartbeatTimeoutMs);
      } catch (e) {
        console.warn("[WS] Heartbeat send failed", e);
      }
    }, this.heartbeatIntervalMs);
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.heartbeatTimer = null;
    this.pongTimeout = null;
  }

  disconnect(): void {
    this.manualClose = true;
    this.clearHeartbeat();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.listeners.clear();
    this.state = "disconnected";
    if (this.debug) console.log("[WS] Disconnected manually");
  }

  // Listener management
  on(event: string, callback: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  once(event: string, callback: Listener): void {
    const wrapper: Listener = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  off(event: string, callback: Listener): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => cb(data));
    }
    if (this.listeners.has("*")) {
      this.listeners.get("*")!.forEach((cb) => cb({ event, data }));
    }
  }

  // Send with queueing
  send(event: string, data: any): void {
    const message = { type: event, data };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      if (this.messageQueue.length >= this.maxQueueSize) {
        this.messageQueue.shift();
      }
      this.messageQueue.push(message);
      if (this.debug)
        console.warn("[WS] Queued message, socket not ready:", event);
    }
  }

  private flushQueue(): void {
    if (this.messageQueue.length === 0) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    if (this.debug)
      console.log(`[WS] Flushing ${this.messageQueue.length} queued messages`);
    this.messageQueue.forEach((msg) =>
      this.socket!.send(JSON.stringify(msg))
    );
    this.messageQueue = [];
  }

  // Utilities
  isConnected(): boolean {
    return this.state === "connected";
  }

  getConnectionState(): WSState {
    return this.state;
  }

  waitForConnection(timeoutMs = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected()) return resolve(true);

      const timer = setTimeout(() => {
        this.off("connection", handler);
        resolve(false);
      }, timeoutMs);

      const handler = (data: any) => {
        if (data.status === "connected") {
          clearTimeout(timer);
          this.off("connection", handler);
          resolve(true);
        }
      };

      this.on("connection", handler);
    });
  }

  forceReconnect(): void {
    if (this.debug) console.log("[WS] Force reconnecting");
    this.disconnect();
    this.connect();
  }

  getStats() {
    return {
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt,
      queuedMessages: this.messageQueue.length,
    };
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
