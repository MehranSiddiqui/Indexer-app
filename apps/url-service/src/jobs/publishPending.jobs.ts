import { ScheduledTask, schedule } from "node-cron";
import urlService from "../services/url.service.js";

const SCHEDULE = "*/30 * * * * *"; // Fires every 30 seconds
let task: ScheduledTask | undefined;

export const startPublishPendingJob = (): void => {
  task = schedule(
    SCHEDULE,
    async () => {
      await urlService.getUnPublishedURLS();
    },
    { name: "pi_indexer_unpublished_urls", noOverlap: true },
  );
};

export const stopPublishPendingJob = async (): Promise<void> => {
  await task?.stop();
};
