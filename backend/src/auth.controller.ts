import { Request, Response } from "express";
import { loginUser,registerUser } from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const user = await registerUser(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser(email, password);

    return res.status(200).json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};