type Listener<T = unknown> = (payload: T) => void;

export class SimpleEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on<T = unknown>(event: string, listener: Listener<T>) {
    const existing = this.listeners.get(event) ?? new Set<Listener>();
    existing.add(listener as Listener);
    this.listeners.set(event, existing);
  }

  off<T = unknown>(event: string, listener: Listener<T>) {
    const existing = this.listeners.get(event);

    if (!existing) {
      return;
    }

    existing.delete(listener as Listener);

    if (existing.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<T = unknown>(event: string, payload: T) {
    const existing = this.listeners.get(event);

    if (!existing) {
      return;
    }

    existing.forEach((listener) => {
      listener(payload);
    });
  }
}
