import { JWTPayload } from "@rocket/shared";

declare global {
  namespace Express {
    interface Request {
      user: JWTPayload;
    }
  }
}
