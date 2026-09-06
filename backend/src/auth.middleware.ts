import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

 const token = authHeader.split(" ")[1];

if (!token) {
  return res.status(401).json({
    message: "Authentication required",
  });
}

try {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET!
  ) as unknown as {
    userId: string;
    email: string;
  };

  req.user = decoded;

  next();
} catch {
  return res.status(401).json({
    message: "Invalid or expired token",
  });
}
};