import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Missing access token" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      tenantId?: string;
      role: Request["user"]["role"];
    };

    req.user = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid access token" });
  }
}
