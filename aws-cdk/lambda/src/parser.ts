import { WatchingEvent } from "./types";

export const parseEvent = (eventString: string): WatchingEvent[] => {
  return eventString
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      const matches = line.match(/{[^}]+}/g) || [];
      return matches
        .map((jsonStr) => {
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            console.error("Failed to parse JSON:", jsonStr);
            return null;
          }
        })
        .filter((obj) => obj !== null);
    });
};
