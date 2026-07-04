import { beforeEach, describe, expect, it } from "vitest";
import dotenv from "dotenv";
import app from "../../../app.js";
import request from "supertest";
import { prisma } from "../../../config/prisma.js";

dotenv.config();

describe("POST /api/v1/auth/register", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: "mhdmehran119@gmail.com",
      },
    });
  });
  it("should register a user", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "mhdmehran119@gmail.com",
      password: "Mehran@B0728",
      name: "Mehran",
    });

    expect(response.status).toBe(201);
  });
});
