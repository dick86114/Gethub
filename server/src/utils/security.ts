import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

export const comparePassword = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash);
};

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
