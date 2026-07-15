// Socket.IO hacia el backend real (www.bizneai.com) para Cocina y Lista de
// espera en pos_desktop. Mismo patrón y nombres de evento que ya usa la app
// Android (src/services/kitchenSocketService.ts) — conexión directa al
// backend real, sin pasar por el servidor local embebido (igual que
// src/api/kitchen.ts, que también hace fetch directo a este mismo host).
import { io, Socket } from 'socket.io-client';
import { BIZNEAI_WAITLIST_API_ORIGIN } from '../api/waitlistApiBase';

export interface KitchenOrderSocketEvent {
  shopId: string;
  order: unknown;
}

export interface KitchenUpdateSocketEvent {
  shopId: string;
  orders?: unknown[];
  orderId?: string;
  order?: unknown;
  deleted?: boolean;
}

export interface OrderStatusSocketEvent {
  shopId: string;
  orderId: string;
  status: string;
  order: unknown;
}

export interface OrderPrioritySocketEvent {
  shopId: string;
  orderId: string;
  priority: string;
  order: unknown;
}

export interface WaitlistUpdateSocketEvent {
  shopId: string;
  action: 'created' | 'status-updated' | 'cancelled';
  entry: unknown;
}

type SocketEventMap = {
  'new-order': KitchenOrderSocketEvent;
  'kitchen-updated': KitchenUpdateSocketEvent;
  'order-status-updated': OrderStatusSocketEvent;
  'order-priority-updated': OrderPrioritySocketEvent;
  'waitlist-updated': WaitlistUpdateSocketEvent;
};

type EventName = keyof SocketEventMap;

class KitchenWaitlistSocketService {
  private socket: Socket | null = null;
  private currentShopId: string | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly listeners = new Map<EventName, Set<(data: any) => void>>();

  connect(shopId: string): void {
    if (!shopId || shopId.startsWith('provisional-')) return;

    if (this.socket?.connected && this.currentShopId === shopId) return;

    if (this.socket) {
      this.disconnect();
    }

    this.currentShopId = shopId;
    this.socket = io(BIZNEAI_WAITLIST_API_ORIGIN, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.joinRooms(shopId);
    });

    this.socket.on('reconnect', () => {
      this.reconnectAttempts = 0;
      this.joinRooms(shopId);
    });

    this.socket.on('connect_error', (error) => {
      if (this.reconnectAttempts === 0) {
        console.warn('[KitchenWaitlistSocket] connect_error (reintentará):', error.message);
      }
      this.reconnectAttempts++;
    });

    this.reRegisterListeners();
  }

  private joinRooms(shopId: string) {
    this.socket?.emit('join-shop', shopId);
    this.socket?.emit('join-kitchen', shopId);
  }

  disconnect(): void {
    if (this.socket) {
      if (this.currentShopId) {
        this.socket.emit('leave-shop', this.currentShopId);
        this.socket.emit('leave-kitchen', this.currentShopId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentShopId = null;
  }

  on<K extends EventName>(event: K, callback: (data: SocketEventMap[K]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback as any);
  }

  off<K extends EventName>(event: K, callback: (data: SocketEventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback as any);
  }

  private reRegisterListeners(): void {
    for (const [event, callbacks] of this.listeners.entries()) {
      for (const callback of callbacks) {
        this.socket?.on(event, callback as any);
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const kitchenWaitlistSocketService = new KitchenWaitlistSocketService();
