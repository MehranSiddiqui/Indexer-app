import { Request, Response, NextFunction } from "express";
import AuthService from "../services/AuthService.js";
import { ResponseSuccessStructure } from "../Classes/ResponseStructure.js";

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const user = await AuthService.registerNewUser(req.body);
    const dataObject = {
      id: user?.id,
      name: user?.name,
      email: user?.email,
    };
    res
      .status(201)
      .json(new ResponseSuccessStructure(dataObject, "User Created", 201));
  }
}

const authController = new AuthController();

export default authController;
