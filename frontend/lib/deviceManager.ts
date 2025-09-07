import { v4 as uuidv4 } from 'uuid';

export class DeviceManager {
  private static instance: DeviceManager;
  private deviceId: string;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private onForceLogout?: () => void;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  public static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  private getOrCreateDeviceId(): string {
    if (typeof window !== 'undefined') {
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    }
    return uuidv4();
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getDeviceInfo(): string {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const tzLabel = timeZone === 'Asia/Kolkata' ? 'IST' : timeZone;
      
      // Extract browser info
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      // Extract OS info
      let os = 'Unknown';
      if (platform.includes('Win')) os = 'Windows';
      else if (platform.includes('Mac')) os = 'macOS';
      else if (platform.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      
      // Show timezone label (e.g., IST) instead of browser locale
      return `${browser} on ${os} (${tzLabel})`;
    }
    return 'Unknown Device';
  }

  public connectWebSocket(token: string, onForceLogout?: () => void) {
    if (typeof window === 'undefined') return;

    this.onForceLogout = onForceLogout;
    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws/${this.deviceId}?token=${token}`;
    
    try {
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message:', message);
          
          if (message.type === 'force_logout') {
            this.handleForceLogout(message.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(token);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  }

  private handleForceLogout(message: string) {
    console.log('Force logout received:', message);
    
    // Clear local storage
    localStorage.removeItem('device_id');
    
    // Call callback if provided
    if (this.onForceLogout) {
      this.onForceLogout();
    }
    
    // Redirect to logout
    setTimeout(() => {
      window.location.href = '/api/auth/logout';
    }, 2000);
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket(token, this.onForceLogout);
      }, 1000 * this.reconnectAttempts);
    }
  }

  public disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  public sendActivity() {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ 
        type: 'activity',
        timestamp: new Date().toISOString()
      }));
    }
  }
}
