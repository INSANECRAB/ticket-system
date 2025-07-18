import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret';

export function signToken(payload: string | object | Buffer, expiresIn: string = '1h') {
  // @ts-expect-error: TypeScript type narrowing issue with jsonwebtoken@9.x and env string
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
} 