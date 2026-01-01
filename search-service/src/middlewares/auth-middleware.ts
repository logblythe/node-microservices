import type { NextFunction, Request, Response } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No user ID provided" });
  }

  req.user = { userId };
  next();
};
