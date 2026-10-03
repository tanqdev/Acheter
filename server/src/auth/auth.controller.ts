import type { Request, Response } from "express";
import { createUser, verifyPassword, findUserByEmail } from "./auth.service";
import {
  createSession,
  deleteSession,
  SESSION_DURATION_TIME,
} from "./sessions";
import { signUpSchema, loginSchema } from "./auth.validation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "./auth.constants";

export async function signup(req: Request, res: Response) {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invlaid Email or Password",
    });
  }
  const { email, password } = parsed.data;

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser != null) {
      return res.status(409).json({
        success: false,
        message: "Email Already Registered",
      });
    }
    const user = await createUser(email, password);
    return res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("SignUp Failed", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invlaid Email or Password",
    });
  }
  const { email, password } = parsed.data;
  try {
    const findUser = await findUserByEmail(email);

    if (!findUser) {
      return res.status(401).json({
        success: false,
        message: "Invlaid Email or Password",
      });
    }

    const passwordValid = await verifyPassword(
      password,
      findUser.password_hash,
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invlaid Email or Password",
      });
    }

    const session = createSession(findUser.id);

    res.cookie(SESSION_COOKIE, (await session).token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_DURATION_TIME,
    });
    return res.status(201).json({
      success: true,
      user: {
        id: findUser.id,
        email: findUser.email,
      },
    });
  } catch (error) {
    console.error("Login Failed", error);
    return res.status(500).json({
      success: false,
      message: "Failed to Log In",
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const token = req.cookies[SESSION_COOKIE];

    if (token) {
      await deleteSession(token);
    }
    res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    console.error("Logout Failed", error);
    return res.status(500).json({
      success: false,
      message: "Failed to Log Out",
    });
  }
}

export async function getMe(req: Request, res: Response) {
  return res.json({
    success: true,
    user: req.user,
  });
}
