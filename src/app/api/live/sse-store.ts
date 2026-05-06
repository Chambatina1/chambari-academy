// Simple in-memory SSE connection store
// Used to track connected students and push annotations in real-time

type Listener = (data: string) => void;

class SSEStore {
  private listeners: Map<string, Set<Listener>> = new Map();
  private lastAnnotationTimestamps: Map<string, string> = new Map();

  /** Register a listener for a given session */
  addListener(sessionId: string, listener: Listener): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }
    this.listeners.get(sessionId)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(sessionId)?.delete(listener);
      if (this.listeners.get(sessionId)?.size === 0) {
        this.listeners.delete(sessionId);
      }
    };
  }

  /** Push data to all listeners of a session */
  push(sessionId: string, data: string): void {
    const sessionListeners = this.listeners.get(sessionId);
    if (sessionListeners) {
      sessionListeners.forEach((listener) => {
        try {
          listener(data);
        } catch {
          // ignore errors from disconnected clients
        }
      });
    }
  }

  /** Get listener count for a session */
  getListenerCount(sessionId: string): number {
    return this.listeners.get(sessionId)?.size || 0;
  }

  /** Track the last annotation timestamp we sent for a session */
  setLastTimestamp(sessionId: string, timestamp: string): void {
    this.lastAnnotationTimestamps.set(sessionId, timestamp);
  }

  getLastTimestamp(sessionId: string): string | undefined {
    return this.lastAnnotationTimestamps.get(sessionId);
  }
}

export const sseStore = new SSEStore();
