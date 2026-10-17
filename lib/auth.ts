export const COOKIE = "dt_session";

/** Cookie value derived from the passcode, so changing APP_PASSCODE logs every device out. Works in edge + node. */
export async function sessionToken(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`deutsch-trainer:v1:${passcode}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  const pass = process.env.APP_PASSCODE;
  if (!pass || !value) return false;
  return value === (await sessionToken(pass));
}
