import { beforeAll, afterAll, vi } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4001";
  process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/auth_test";
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "12345678901234567890123456789012";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "12345678901234567890123456789012";
});

afterAll(() => {
  vi.restoreAllMocks();
});
