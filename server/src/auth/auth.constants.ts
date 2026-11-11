export const SESSION_COOKIE = "session";

const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // Production clients and APIs are commonly hosted on different origins.
  // Cross-origin session cookies require HTTPS and SameSite=None.
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};
