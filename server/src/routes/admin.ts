import { Router } from 'express';
import prisma from '../prisma';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { UserRole, WithdrawalStatus, OrderStatus } from '../types';

const router = Router();

router.get('/stats', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalEarning,
      pendingOrders,
      pendingCertifications,
      pendingWithdrawals,
      todayOrders,
      todayRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.transaction.aggregate({
        where: { type: 'EARNING' },
        _sum: { amount: true }
      }),
      prisma.order.count({ where: { status: OrderStatus.PAID } }),
      prisma.certification.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'ORDER_PAY',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { amount: true }
      })
    ]);

    success(res, {
      totalUsers,
      totalOrders,
      totalEarning: Math.abs(totalEarning._sum.amount || 0),
      pendingOrders,
      pendingCertifications,
      pendingWithdrawals,
      todayOrders,
      todayRevenue: Math.abs(todayRevenue._sum.amount || 0)
    });
  } catch (err) {
    error(res, 500, '获取统计失败');
  }
});

router.get('/users', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { role, keyword, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {};
    if (role && role !== 'ALL') where.role = role;
    if (keyword) {
      where.OR = [
        { username: { contains: keyword as string } },
        { nickname: { contains: keyword as string } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          role: true,
          balance: true,
          isOnline: true,
          acceptOrders: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              bossOrders: true,
              proOrders: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    success(res, {
      list: users,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    error(res, 500, '获取用户列表失败');
  }
});

router.get('/orders', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { status, keyword, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (keyword) {
      where.orderNo = { contains: keyword as string };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          boss: { select: { id: true, nickname: true, avatar: true } },
          pro: { select: { id: true, nickname: true, avatar: true } },
          game: true,
          skill: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    success(res, {
      list: orders,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    error(res, 500, '获取订单列表失败');
  }
});

router.get('/withdrawals', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
          reviewer: { select: { id: true, nickname: true } }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.withdrawal.count({ where })
    ]);

    success(res, {
      list: withdrawals,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    error(res, 500, '获取提现列表失败');
  }
});

router.put('/withdrawal/:id/review', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return error(res, 400, '审核状态无效');
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) {
      return error(res, 404, '提现申请不存在');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return error(res, 400, '该申请已审核');
    }

    const result = await prisma.$transaction(async (tx) => {
      let updated;

      if (status === 'REJECTED') {
        const user = await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } }
        });

        updated = await tx.withdrawal.update({
          where: { id },
          data: {
            status: WithdrawalStatus.REJECTED,
            reviewerId: req.user!.id,
            reviewedAt: new Date(),
            remark: remark || undefined
          }
        });

        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'WITHDRAWAL_FAILED',
            amount: withdrawal.amount,
            balance: user.balance,
            remark: `提现失败退款 - ${remark || '审核不通过'}`
          }
        });
      } else {
        updated = await tx.withdrawal.update({
          where: { id },
          data: {
            status: WithdrawalStatus.APPROVED,
            reviewerId: req.user!.id,
            reviewedAt: new Date(),
            remark: remark || undefined
          }
        });
      }

      return updated;
    });

    success(res, result, '审核完成');
  } catch (err) {
    error(res, 500, '审核失败');
  }
});

router.post('/game', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { name, icon, category, description } = req.body;

    if (!name || !icon || !category) {
      return error(res, 400, '请填写完整信息');
    }

    const game = await prisma.game.create({
      data: { name, icon, category, description }
    });

    success(res, game, '添加成功');
  } catch (err) {
    error(res, 500, '添加失败');
  }
});

router.put('/game/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, icon, category, description, isActive } = req.body;

    const game = await prisma.game.update({
      where: { id },
      data: {
        name: name || undefined,
        icon: icon || undefined,
        category: category || undefined,
        description: description || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    success(res, game, '更新成功');
  } catch (err) {
    error(res, 500, '更新失败');
  }
});

router.put('/pro/:id/accept-orders', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { acceptOrders } = req.body;

    if (id !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { acceptOrders: Boolean(acceptOrders) },
      select: {
        id: true,
        nickname: true,
        acceptOrders: true
      }
    });

    success(res, user, acceptOrders ? '已开启接单' : '已关闭接单');
  } catch (err) {
    error(res, 500, '操作失败');
  }
});

export default router;
