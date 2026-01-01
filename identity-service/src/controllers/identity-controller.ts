import type { Request, Response } from "express";
import RefreshTokenModel from "../models/refresh-token.schema";
import UserModel from "../models/user.schema";
import { generateToken } from "../utils/generate-token";
import { logger } from "../utils/logger";
import { validateLogin, validateRegistration } from "../utils/validation";

export const registerUser = async (req: Request, res: Response) => {
  logger.info("Registering a new user");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation failed: %s", error.message);
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        error: error.message,
      });
    }
    const { username, email, password } = req.body;

    let user = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn(
        "User already exists with username: %s or email: %s",
        username,
        email
      );
      return res.status(409).json({
        success: false,
        message: "Username or email already in use",
      });
    }

    user = new UserModel({ username, email, password });
    await user.save();
    logger.info("User registered successfully: %s", username);

    const { accessToken, refreshToken } = await generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error("Registration error: %s", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  logger.info("User login attempt");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation failed: %s", error.message);
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        error: error.message,
      });
    }

    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      logger.warn("No user found with email: %s", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid password attempt for email: %s", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error("Login error: %s", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  logger.info("Token refresh attempt");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("No refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const storedToken = await RefreshTokenModel.findOne({
      token: refreshToken,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid refresh token provided");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await UserModel.findById(storedToken.user);

    if (!user) {
      logger.warn("User not found for the provided refresh token");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await RefreshTokenModel.deleteOne({ token: refreshToken });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    logger.error("Token refresh error: %s", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshTokenModel.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    logger.info("Refresh token deleted for logout");

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    logger.error("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
