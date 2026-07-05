import { Request, Response, NextFunction } from "express";
import AuthService from "../services/AuthService.js";
import { ResponseSuccessStructure } from "../Classes/ResponseStructure.js";
import { RegisterResponseDTO } from "../DTO/auth/RegisterResponse.dto.js";
import { User } from "../generated/prisma/client.js";

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
    res
      .status(200)
      .json(new ResponseSuccessStructure(user, "User logged in", 200));
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    
  }
}

const authController = new AuthController();

export default authController;
