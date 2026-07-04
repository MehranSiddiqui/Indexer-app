import { User } from "../../generated/prisma/client.js";

export class RegisterResponseDTO {
  id: string;
  name: string;
  email: string;

  constructor(user: User) {
    this.id = user?.id;
    this.email = user.email;
    this.name = user.name;
  }
}
