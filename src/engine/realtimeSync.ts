// ==========================================
// Q-Care Real-Time Synchronization Bus
// Cross-Tab / Cross-Window Live Real-Time Engine
// ==========================================

export interface RealtimeMessage {
  type: 
    | 'QUEUE_UPDATED' 
    | 'TEST_STATUS_CHANGED' 
    | 'LAB_AVAILABILITY_CHANGED' 
    | 'MACHINE_COUNT_CHANGED' 
    | 'TEST_COMPLETED' 
    | 'PATIENT_REGISTERED' 
    | 'RECOMMENDATION_RECALCULATED'
    | 'AUDIT_LOG_ADDED'
    | 'STORE_SYNC';
  hospitalId?: string;
  patientId?: string;
  testId?: string;
  departmentId?: string;
  message?: string;
  timestamp: number;
}

type RealtimeListener = (msg: RealtimeMessage) => void;

class RealtimeSyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<RealtimeListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('qcare_live_sync_v1');
        this.channel.onmessage = (event: MessageEvent<RealtimeMessage>) => {
          this.notifyListeners(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization skipped:', err);
      }
    }

    // Fallback: Storage event listener for cross-window notifications
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'qcare_realtime_ping' && e.newValue) {
          try {
            const data: RealtimeMessage = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {}
        }
      });
    }
  }

  private notifyListeners(msg: RealtimeMessage) {
    this.listeners.forEach(listener => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in realtime listener:', err);
      }
    });
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(type: RealtimeMessage['type'], meta: Partial<RealtimeMessage> = {}) {
    const msg: RealtimeMessage = {
      type,
      timestamp: Date.now(),
      ...meta
    };

    // 1. Broadcast via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel postMessage error:', err);
      }
    }

    // 2. Storage event trigger for multi-process / cross-window fallbacks
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qcare_realtime_ping', JSON.stringify(msg));
      } catch {}
    }
  }
}

export const realtimeSync = new RealtimeSyncBus();
