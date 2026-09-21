import { DEMO_TIMELINE_EVENTS } from '../data/demoTimeline';
import type { TimelineEvent } from '../types/demoTypes';

export class DemoTimelineEngine {
  private events: TimelineEvent[];

  constructor() {
    this.events = JSON.parse(JSON.stringify(DEMO_TIMELINE_EVENTS));
  }

  public getEvents(): TimelineEvent[] {
    return [...this.events];
  }

  public getEventById(id: string): TimelineEvent | null {
    return this.events.find((e) => e.id === id) || null;
  }

  public getEventsByCategory(category: TimelineEvent['category']): TimelineEvent[] {
    return this.events.filter((e) => e.category === category);
  }

  public reset(): void {
    this.events = JSON.parse(JSON.stringify(DEMO_TIMELINE_EVENTS));
  }
}

export const demoTimelineEngine = new DemoTimelineEngine();
