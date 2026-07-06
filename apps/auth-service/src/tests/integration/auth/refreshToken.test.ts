import { beforeEach, describe, expect, it } from "vitest";
import dotenv from "dotenv";
import app from "../../../app.js";
import request from "supertest";
import { prisma } from "../../../config/prisma.js";

dotenv.config();

const endpoint = "/api/v1/auth/refresh";
describe(`POST ${endpoint}`, () => {
  it("should return 200 with accessToken and refreshToken", async () => {
    const response = await request(app).post(endpoint).send({
      refreshToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1laHJhbkBnbWFpbC5jb20iLCJpZCI6IjA1MzMwMWVlLWYzZDAtNDkzNS1hZjU2LWE0MjIxNzI0MDBhNSIsImlhdCI6MTc4MzI0MTI2MiwiZXhwIjoxNzgzODQ2MDYyfQ.Q0uzNAYnEgkIplt9kE18NjxyUsUT87qpW4sZ-s5ypn4",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
  });
});
