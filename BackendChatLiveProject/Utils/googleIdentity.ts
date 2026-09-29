import { OAuth2Client, type TokenPayload } from "google-auth-library";

import { env } from "../config/env";
import ApiError from "./ApiError";

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: true;
  name: string;
  picture: string | null;
}

let cached: OAuth2Client | null = null;

function isGoogleConfigured(): boolean {
  return env.GOOGLE_CLIENT_ID.length > 0;
}

function oauthClient(): OAuth2Client {
  if (!isGoogleConfigured()) {
    throw new ApiError(
      503,
      "Google sign-in is not configured on the server. Set GOOGLE_CLIENT_ID in the .env file.",
    );
  }
  cached ??= new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return cached;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const client = oauthClient();

  let payload: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason.includes("Wrong recipient") || reason.includes("audience")) {
      throw ApiError.unauthorized(
        "This Google token was issued for another application. Check that GOOGLE_CLIENT_ID (server) and VITE_GOOGLE_CLIENT_ID (frontend) have the same value.",
      );
    }
    throw ApiError.unauthorized(
      "Google sign-in failed: the token is invalid or has expired. Please try again.",
    );
  }

  if (!payload?.sub || !payload.email) {
    throw ApiError.unauthorized(
      "Google did not provide an email address. Try again and allow sharing your address.",
    );
  }
  if (!payload.email_verified) {
    throw ApiError.unauthorized(
      "This Google address is not verified. Confirm it with Google before continuing.",
      "email",
    );
  }

  return {
    googleId: payload.sub,
    email: payload.email.trim().toLowerCase(),
    emailVerified: true,
    name: (payload.name || payload.given_name || payload.email.split("@")[0]).trim(),
    picture: payload.picture ?? null,
  };
}
