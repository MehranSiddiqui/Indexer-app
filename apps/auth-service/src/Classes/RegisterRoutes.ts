import { Router } from "express";
import authRoute from "../routes/authRoutes.js";
import { appOptions } from "../constants/app.constants.js";
interface RouterConfig {
  path: string;
  router: Router;
}

const API_PREFIX = appOptions?.API_PREFIX;

export class RegisterRoutes {
  private routes: RouterConfig[] = [];

  private register(path: string, router: Router): void {
    this.routes.push({ path: `${API_PREFIX}${path}`, router });
  }

  addRoutes(): void {
    this.register("/auth/register", authRoute);
  }

  getRoutes(): RouterConfig[] {
    return this.routes;
  }
}
