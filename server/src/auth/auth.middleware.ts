import { Request, Response, NextFunction } from "express";
import { getSession } from "./sessions";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "./auth.constants";
import { Session } from "node:inspector";

// Shape of the authenticated user that will be attached to req.user.
export interface AuthenticatedUser {
  id: number;
  email: string;
}

// Extend Express's Request type so Typescript knows about our custom req.user property.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
// The AuthMiddleware function that will protect routes
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Get the Session's token from the Browser's Cookie
  const token = req.cookies[SESSION_COOKIE];
  // If Token not found that means user is not authenticated
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication Required",
    });
  }
  try {
    // Get the current Session from the derived token
    const session = await getSession(token);
    // If Session not found that means Session is expired
    if (!session) {
      // Remove the invalid session cookie from the browser
      res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);
      res.status(401).json({
        success: false,
        message: "Session Expired or Invalid",
      });
    }
    // Attach the Authenticated User's information to the Request body so The controller handling this request can access it
    req.user = {
      id: session.user_id,
      email: session.email,
    };

    // Authentication Succeeded? MOve to next Controller/Middleware
    next();
  } catch (error) {
    console.error("Authentication Failed", error);
    return res.status(500).json({
      success: false,
      message: "Authentication Check Failed",
    });
  }
}
