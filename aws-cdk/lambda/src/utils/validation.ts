import { WatchingEvent } from "lambda/src/types";

export const isValidWatchingEvent = (event: any): event is WatchingEvent => {
  return (
    typeof event === "object" &&
    typeof event.userId === "string" &&
    typeof event.contentId === "string" &&
    typeof event.mediaVideoId === "string" &&
    typeof event.progress === "number" &&
    event.progress >= 0 &&
    event.progress <= 100 &&
    typeof event.timestamp === "number"
  );
};

export const deduplicateEventByContent = (events: WatchingEvent[]) => {
  const eventMap = new Map<string, WatchingEvent>();

  for (const event of events) {
    const key = `${event.userId}-${event.contentId}`;
    const existingEvent = eventMap.get(key);

    if (!existingEvent || event.timestamp > existingEvent.timestamp) {
      eventMap.set(key, event);
    }
  }

  return eventMap;
};

export const deduplicateEventByMediaVideo = (events: WatchingEvent[]) => {
  const eventMap = new Map<string, WatchingEvent>();

  for (const event of events) {
    const key = `${event.userId}-${event.contentId}-${event.mediaVideoId}`;
    const existingEvent = eventMap.get(key);

    if (!existingEvent || event.timestamp > existingEvent.timestamp) {
      eventMap.set(key, event);
    }
  }

  return eventMap;
};
