import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
};

export const roleMiddleware = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    next();
  };
};

export { AuthRequest };
