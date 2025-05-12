// A simple event bus for cross-component communication
type EventCallback = (data?: any) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  // Subscribe to an event
  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Trigger an event
  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  // Remove all listeners for an event
  off(event: string) {
    delete this.events[event];
  }
}

// Create a singleton instance
const eventBus = typeof window !== 'undefined' ? new EventBus() : null;

export default eventBus; 