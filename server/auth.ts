import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Read Firebase Project ID from config
let cachedProjectId: string | null = null;
function getFirebaseProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  if (cachedProjectId) return cachedProjectId;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      cachedProjectId = config.projectId || '';
      return cachedProjectId;
    }
  } catch (err) {
    console.warn('Could not read firebase-applet-config.json', err);
  }
  return '';
}

// Cache Google's public certificates for Firebase ID token verification
let publicKeysCache: { [kid: string]: string } = {};
let publicKeysExpiry = 0;

async function getGooglePublicKeys(): Promise<{ [kid: string]: string }> {
  const now = Date.now();
  if (Object.keys(publicKeysCache).length > 0 && now < publicKeysExpiry) {
    return publicKeysCache;
  }

  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (!res.ok) {
      throw new Error(`Failed to fetch Google public certs: ${res.statusText}`);
    }
    const cacheControl = res.headers.get('cache-control');
    let maxAgeSeconds = 3600;
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) {
        maxAgeSeconds = parseInt(match[1], 10);
      }
    }
    publicKeysCache = await res.json();
    publicKeysExpiry = now + (maxAgeSeconds * 1000);
    return publicKeysCache;
  } catch (err) {
    console.error('Error fetching Google public certs:', err);
    return publicKeysCache;
  }
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Verifies Firebase ID tokens cryptographically against Google's public certs
 */
export async function verifyFirebaseToken(token: string): Promise<AuthenticatedUser> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT: must have 3 sections');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecode(headerB64));
  const payload = JSON.parse(base64UrlDecode(payloadB64));

  const projectId = getFirebaseProjectId();
  const nowInSec = Math.floor(Date.now() / 1000);

  // Validate standard Firebase ID Token claims
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error(`Invalid issuer: expected https://securetoken.google.com/${projectId}, got ${payload.iss}`);
  }
  if (payload.aud !== projectId) {
    throw new Error(`Invalid audience: expected ${projectId}, got ${payload.aud}`);
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Invalid subject: missing user UID');
  }
  if (payload.exp && payload.exp < nowInSec) {
    throw new Error('Token has expired');
  }
  if (payload.auth_time && payload.auth_time > nowInSec + 300) {
    throw new Error('Token issued in the future');
  }

  // Cryptographic signature check
  const certs = await getGooglePublicKeys();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error(`No matching public cert found for kid: ${header.kid}`);
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  const isValid = verifier.verify(cert, signatureB64, 'base64url');

  if (!isValid) {
    throw new Error('Signature verification failed');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  };
}

/**
 * Express middleware to enforce Firebase Auth verification
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized: Empty token' });
    return;
  }

  try {
    const user = await verifyFirebaseToken(idToken);
    req.user = user;
    next();
  } catch (err: any) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ error: `Unauthorized: ${err.message}` });
  }
}
