import { NextFunction, Response, Request } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { Session } from "../lib/session.js";

declare module "express-serve-static-core" {
    interface Request {
        session: Session
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });

    if (!session?.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    req.session = session;
    next();
}