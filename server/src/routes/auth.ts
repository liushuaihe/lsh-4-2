import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { config } from '../config';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(20),
  nickname: z.string().min(1).max(20),
  role: z.enum(['BOSS', 'PRO']).default('BOSS')
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existingUser) {
      return error(res, 400, '用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        nickname: data.nickname,
        role: data.role as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        avatar: true,
        balance: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    success(res, { user, token }, '注册成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(res, 400, err.errors[0].message);
    }
    error(res, 500, '注册失败');
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (!user) {
      return error(res, 401, '用户名或密码错误');
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      return error(res, 401, '用户名或密码错误');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    success(res, {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        avatar: user.avatar,
        balance: user.balance,
        isOnline: true,
        acceptOrders: user.acceptOrders
      },
      token
    }, '登录成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(res, 400, err.errors[0].message);
    }
    error(res, 500, '登录失败');
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { isOnline: false }
      });
    }
    success(res, null, '登出成功');
  } catch (err) {
    error(res, 500, '登出失败');
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        avatar: true,
        phone: true,
        balance: true,
        isOnline: true,
        acceptOrders: true,
        createdAt: true
      }
    });

    if (!user) {
      return error(res, 404, '用户不存在');
    }

    success(res, user);
  } catch (err) {
    error(res, 500, '获取用户信息失败');
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { nickname, avatar, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        nickname: nickname || undefined,
        avatar: avatar || undefined,
        phone: phone || undefined
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        avatar: true,
        phone: true,
        balance: true,
        isOnline: true,
        acceptOrders: true
      }
    });

    success(res, user, '更新成功');
  } catch (err) {
    error(res, 500, '更新失败');
  }
});

router.post('/switch-role', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { role } = req.body;

    if (!['BOSS', 'PRO'].includes(role)) {
      return error(res, 400, '无效的角色');
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role: role as UserRole },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        avatar: true,
        balance: true,
        acceptOrders: true
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    success(res, { user, token }, '角色切换成功');
  } catch (err) {
    error(res, 500, '切换失败');
  }
});

export default router;
