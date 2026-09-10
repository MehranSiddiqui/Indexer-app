import z from "zod";

export const urlValidator = z.object({
  url: z.url(),
});
