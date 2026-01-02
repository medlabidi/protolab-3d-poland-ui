import jwt, { Secret } from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Clean environment variable values (remove quotes, whitespace, \r\n)
const cleanEnvValue = (value: string | undefined, defaultValue: string): string => {
  if (!value) return defaultValue;
  return value.trim().replace(/^["']|["']$/g, '').replace(/\\r\\n/g, '').replace(/\r\n/g, '');
};

const getAccessSecret = (): Secret => cleanEnvValue(process.env.JWT_ACCESS_SECRET, 'access-secret');
const getRefreshSecret = (): Secret => cleanEnvValue(process.env.JWT_REFRESH_SECRET, 'refresh-secret');
const getAccessExpiresIn = (): string => cleanEnvValue(process.env.JWT_ACCESS_EXPIRES_IN, '15m');
const getRefreshExpiresIn = (): string => cleanEnvValue(process.env.JWT_REFRESH_EXPIRES_IN, '7d');

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: getAccessExpiresIn(),
  } as any);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: getRefreshExpiresIn(),
  } as any);
};

export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, getAccessSecret()) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, getRefreshSecret()) as JWTPayload;
};

export const getRefreshTokenExpiry = (): Date => {
  const expiresIn = getRefreshExpiresIn();
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  
  return new Date(Date.now() + value * multipliers[unit]);
};
