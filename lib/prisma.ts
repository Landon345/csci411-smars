import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// 1. Setup the Connection Pool (required for @prisma/adapter-pg)
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Define the logic to create a new instance
const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

// 3. Setup the Global type for TypeScript
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// 4. Initialize or retrieve the singleton
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

// 5. Save to global object in development to prevent connection leaks
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
