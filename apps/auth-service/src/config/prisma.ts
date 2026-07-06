import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "./env.js";

//The pool and adapter are in prisma 7.8.0
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter= new PrismaPg(pool)


declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
