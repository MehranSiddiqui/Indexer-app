import { Router } from "express";
import { env } from "../config/env.js";
interface RoutesConfig {
  path: String;
  router: Router;
}

const API_PREFIX = `${env.API_PREFIX}${env.API_VERSION}`;
class RouteRegister {
  private routes: RoutesConfig[] = [];

  private register(path: string, router: Router): void {
    this.routes.push({ path: `${API_PREFIX}${path}`, router });
  }

  addRoutes() {
    this.register("/url");
  }
  getRoutes(): RoutesConfig[] {
    return this.routes;
  }
}
