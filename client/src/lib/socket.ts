import { io, Socket } from 'socket.io-client';
import { API_CONFIG, WS_CONFIG } from '@/config';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      console.log('Socket sẵn sàng và đã kết nối.');
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

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log(' Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket ngắt kết nối', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket kết nối thất bại:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        console.error('Đã đạt số lần kết nối lại tối đa.');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`socket kêt nối lại sau ${attemptNumber} lần thử`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('socket kết nối lại thất bại sau nhiều lần thử', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('socket kết nối lại thất bại sau nhiều lần thử:');
      this.disconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  onIoTData(callback: (data: any) => void): void {
    this.socket?.on('iot:data', callback);
  }

  onSensorUpdate(callback: (data: any) => void): void {
    this.socket?.on('sensor:update', callback);
  }

  onDeviceStatus(callback: (data: any) => void): void {
    this.socket?.on('device:status', callback);
  }

  onSystemAlert(callback: (data: any) => void): void {
    this.socket?.on('system:alert', callback);
  }

  onAutomationTriggered(callback: (data: any) => void): void {
    this.socket?.on('automation:triggered', callback);
  }

  controlLED(data: { led1?: boolean; led2?: boolean }): void {
    this.socket?.emit('control:led', data);
  }

  controlServo(angle: number): void {
    this.socket?.emit('control:servo', { angle });
  }

  requestIoTData(): void {
    this.socket?.emit('request:iot-data');
  }

  requestSensorData(): void {
    this.socket?.emit('request:sensor-data');
  }

  offIoTData(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('iot:data', callback);
    } else {
      this.socket?.off('iot:data');
    }
  }

  offSensorUpdate(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('sensor:update', callback);
    } else {
      this.socket?.off('sensor:update');
    }
  }

  offDeviceStatus(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('device:status', callback);
    } else {
      this.socket?.off('device:status');
    }
  }

  offAll(): void {
    this.socket?.off('iot:data');
    this.socket?.off('sensor:update');
    this.socket?.off('device:status');
    this.socket?.off('system:alert');
    this.socket?.off('automation:triggered');
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.offAll();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  updateToken(token: string): void {
    if (this.socket?.auth) {
      (this.socket.auth as any).token = token;
    }
  }
}

export const socketService = new SocketService();

export default SocketService;
