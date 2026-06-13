import { fal } from "@fal-ai/client";

if (typeof window !== "undefined") {
  throw new Error("fal.ts must only be imported on the server");
}

fal.config({ credentials: process.env.FAL_KEY });

export { fal };
