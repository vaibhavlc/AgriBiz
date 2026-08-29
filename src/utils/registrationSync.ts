export interface RegistrationSyncEvent {
  type: 'EMAIL_VERIFIED' | 'REGISTRATION_COMPLETED' | 'REGISTRATION_CANCELLED';
  registrationSessionId: string;
  email?: string;
  timestamp: number;
}

const CHANNEL_NAME = 'agribiz-registration-sync';
const STORAGE_KEY = 'agribiz_registration_sync_event';

class RegistrationSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: RegistrationSyncEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (msgEvent) => {
          if (msgEvent.data && msgEvent.data.registrationSessionId) {
            this.notifyListeners(msgEvent.data);
          }
        };
      } catch (err) {
        console.warn('[RegistrationSync] BroadcastChannel fallback to storage:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const data: RegistrationSyncEvent = JSON.parse(e.newValue);
            if (data && data.registrationSessionId) {
              this.notifyListeners(data);
            }
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  private notifyListeners(event: RegistrationSyncEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[RegistrationSync] Listener execution error:', err);
      }
    });
  }

  public subscribe(listener: (event: RegistrationSyncEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(event: Omit<RegistrationSyncEvent, 'timestamp'>) {
    const fullEvent: RegistrationSyncEvent = {
      ...event,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(fullEvent);
      } catch (err) {
        console.warn('[RegistrationSync] BroadcastChannel postMessage failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullEvent));
      } catch {
        // Ignore storage write errors
      }
    }

    this.notifyListeners(fullEvent);
  }

  public getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sessionId = sessionStorage.getItem('agribiz_registration_session_id');
    if (!sessionId) {
      const draftRaw = localStorage.getItem('agribiz_reg_draft');
      if (draftRaw) {
        try {
          const parsed = JSON.parse(draftRaw);
          if (parsed.registrationSessionId) {
            sessionId = parsed.registrationSessionId;
          }
        } catch {
          // Ignore
        }
      }
    }
    if (!sessionId) {
      sessionId = `reg_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    sessionStorage.setItem('agribiz_registration_session_id', sessionId);
    return sessionId;
  }

  public clearSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('agribiz_registration_session_id');
    localStorage.removeItem('agribiz_reg_draft');
    localStorage.removeItem('agribiz_verified_email');
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const registrationSync = new RegistrationSyncService();
export default registrationSync;
