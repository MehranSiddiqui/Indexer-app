import { JWTPayload } from "../Types/sharedTypes.js";

export const isJWTPayload = (payload: unknown): payload is JWTPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "string" &&
    "email" in payload &&
    typeof payload.email === "string"
  );
};
