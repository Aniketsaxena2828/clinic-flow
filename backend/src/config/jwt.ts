import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  clinicId: string;
  roleName: string;
  email: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'clinicflow_access_secret_super_key_2026_x987';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'clinicflow_refresh_secret_super_key_2026_y654';

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_ACCESS_SECRET || 'clinicflow_access_secret_super_key_2026_x987';
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || 'clinicflow_refresh_secret_super_key_2026_y654';
  return jwt.verify(token, secret) as TokenPayload;
};
