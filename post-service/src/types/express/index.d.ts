import "express";
import Redis from "ioredis"; // Fix 1: Import the default class

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      redisClient?: Redis;
    }
  }
}

export {};
