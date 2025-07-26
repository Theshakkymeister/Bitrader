import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPg(session);

// Production-ready session configuration
export const getSessionConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    store: new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: isProduction, // Only secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "strict" : "lax" as const,
    },
    name: "bitrader.session",
  };
};

console.log("SESSION CONFIG: Environment is", process.env.NODE_ENV || "development");
console.log("SESSION CONFIG: Secure cookies", process.env.NODE_ENV === "production");