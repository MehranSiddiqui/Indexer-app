import { Request, Response, NextFunction } from "express";
import AuthService from "../services/AuthService.js";
import { ResponseSuccessStructure } from "../Classes/ResponseStructure.js";
import { RegisterResponseDTO } from "../DTO/auth/RegisterResponse.dto.js";
import { User } from "../generated/prisma/client.js";
import { cookieOptions } from "../constants/cookie.constants.js";

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const user = await AuthService.registerNewUser(req.body);
    const response = new RegisterResponseDTO(user as User);
    res
      .status(201)
      .json(new ResponseSuccessStructure(response, "User Created", 201));
  }

  async login(req: Request, res: Response): Promise<void> {
    const user = await AuthService.loginUser(req.body);
    res.cookie("refresh_token", user.refreshToken, cookieOptions);
    res
      .status(200)
      .json(new ResponseSuccessStructure(user, "User logged in", 200));
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const token = req.cookies.refresh_token;
    const user = await AuthService.rotateRefreshToken(token);
    res.cookie("refresh_token", user.refreshToken, cookieOptions);
    res
      .status(200)
      .json(new ResponseSuccessStructure(user, "Tokens refreshed", 200));
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies.refresh_token;
    await AuthService.logoutUser(token);
    res.clearCookie("refresh_token", cookieOptions);
    res
      .status(200)
      .json(new ResponseSuccessStructure(null, "User logged out", 200));
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const id = req.user.id;

    const user = await AuthService.getUserDetails(id);
    res.status(200).json(new ResponseSuccessStructure(user, "User found", 200));
  }
}

const authController = new AuthController();

export default authController;
