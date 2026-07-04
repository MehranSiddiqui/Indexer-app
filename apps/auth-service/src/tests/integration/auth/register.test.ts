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

describe("POST /api/v1/auth/register", () => {
  it("should return 409 if email user exists", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "mhdmehran119@gmail.com",
      password: "Mehran@B0728",
      name: "Mehran",
    });

    expect(response.status).toBe(409);
  });
});
describe("POST /api/v1/auth/register", () => {
  it("should return 400 for invalid email", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "mhdmehran119",
      password: "Mehran@B0728",
      name: "Mehran",
    });

    expect(response.status).toBe(400);
  });
});
describe("POST /api/v1/auth/register", () => {
  it("should return 400 for invalid password", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "mhdmehran112@gmail.com",
      password: "13165",
      name: "Mehran",
    });

    expect(response.status).toBe(400);
  });
});
describe("POST /api/v1/auth/register", () => {
  it("should return 400 for name is missing", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "mhdmehran119@gmail.com",
      password: "13165",
    });

    expect(response.status).toBe(400);
  });
});
describe("POST /api/v1/auth/register", () => {
  it("should return 400 for password is missing", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "mhdmehran119@gmail.com",

      name: "Password",
    });

    expect(response.status).toBe(400);
  });
});
describe("POST /api/v1/auth/register", () => {
  it("should return 400 for empty object", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({});

    expect(response.status).toBe(400);
  });
});
