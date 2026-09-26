export const SESSION_COOKIE = "session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
  path: "/",
};
