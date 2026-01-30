import { io, Socket } from 'socket.io-client';
import { API_CONFIG, WS_CONFIG } from '@/config';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  /**
   * Initialize socket connection
   */
  connect(token?: string): Socket {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const socketOptions = {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: token || this.getToken(),
      },
      reconnection: true,
      reconnectionDelay: WS_CONFIG.RECONNECT_INTERVAL,
      reconnectionAttempts: WS_CONFIG.MAX_RECONNECT_ATTEMPTS,
      timeout: 20000,
    };

    this.socket = io(API_CONFIG.BASE_URL, socketOptions);

    this.setupEventHandlers();

    return this.socket;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      this.disconnect();
    });

    // Custom events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Get auth token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Subscribe to IoT data updates
   */
  onIoTData(callback: (data: any) => void): void {
    this.socket?.on('iot:data', callback);
  }

  /**
   * Subscribe to sensor updates
   */
  onSensorUpdate(callback: (data: any) => void): void {
    this.socket?.on('sensor:update', callback);
  }

  /**
   * Subscribe to device status updates
   */
  onDeviceStatus(callback: (data: any) => void): void {
    this.socket?.on('device:status', callback);
  }

  /**
   * Subscribe to system alerts
   */
  onSystemAlert(callback: (data: any) => void): void {
    this.socket?.on('system:alert', callback);
  }

  /**
   * Subscribe to automation events
   */
  onAutomationTriggered(callback: (data: any) => void): void {
    this.socket?.on('automation:triggered', callback);
  }

  /**
   * Emit LED control command
   */
  controlLED(data: { led1?: boolean; led2?: boolean }): void {
    this.socket?.emit('control:led', data);
  }

  /**
   * Emit servo control command
   */
  controlServo(angle: number): void {
    this.socket?.emit('control:servo', { angle });
  }

  /**
   * Request latest IoT data
   */
  requestIoTData(): void {
    this.socket?.emit('request:iot-data');
  }

  /**
   * Request sensor data
   */
  requestSensorData(): void {
    this.socket?.emit('request:sensor-data');
  }

  /**
   * Unsubscribe from IoT data
   */
  offIoTData(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('iot:data', callback);
    } else {
      this.socket?.off('iot:data');
    }
  }

  /**
   * Unsubscribe from sensor updates
   */
  offSensorUpdate(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('sensor:update', callback);
    } else {
      this.socket?.off('sensor:update');
    }
  }

  /**
   * Unsubscribe from device status
   */
  offDeviceStatus(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('device:status', callback);
    } else {
      this.socket?.off('device:status');
    }
  }

  /**
   * Unsubscribe from all events
   */
  offAll(): void {
    this.socket?.off('iot:data');
    this.socket?.off('sensor:update');
    this.socket?.off('device:status');
    this.socket?.off('system:alert');
    this.socket?.off('automation:triggered');
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.offAll();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Update auth token
   */
  updateToken(token: string): void {
    if (this.socket?.auth) {
      (this.socket.auth as any).token = token;
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export class for testing
export default SocketService;
