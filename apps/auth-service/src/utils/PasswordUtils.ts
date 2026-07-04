import bcrypt from "bcrypt";
import { authConstants } from "../constants/auth.constants.js";

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, authConstants.PASSWORD_HASH_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
