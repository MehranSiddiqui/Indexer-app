import { User } from "../../generated/prisma/client.js";

export type LoginRequestDTO = {
  email: string;
  password: string;
};

export class LoginResponse {
  id: string;
  name: string;
  email: string;

  constructor(user: Pick<User, "id" | "name" | "email">) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
  }
}

export type LoginResult = {
  user: LoginResponse;
  accessToken: string;
  refreshToken: string;
};

export class UserDetailDTO {
  id: string;
  email: string;
  name: string;
  createdAt: Date;

  constructor(user: Pick<User, "id" | "email" | "name" | "createdAt">) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.createdAt = user.createdAt;
  }
}
