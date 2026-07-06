import { beforeEach, describe, expect, it } from "vitest";
import dotenv from "dotenv";
import app from "../../../app.js";
import request from "supertest";
import { prisma } from "../../../config/prisma.js";

dotenv.config();

describe("POST /api/v1/auth/login", () => {
  it("should return 200 status code and user data", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "mehran@gmail.com",
      password: "Burooj@2807",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("should return 400 status code and error message", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "mehran@gmail.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("should return 401 if user doesnot exist", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "nonexistent@gmail.com",
      password: "Burooj@2807",
    });

    expect(response.status).toBe(401);
  });
});
describe("POST /api/v1/auth/login", () => {
  it("should return 400 for empty object", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({});

    expect(response.status).toBe(400);
  });
});
