import { Router } from 'express';
import prisma from '../prisma';
import { config } from '../config';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { TransactionType, UserRole, WithdrawalStatus } from '../types';

const router = Router();

router.post('/recharge', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { amount, payMethod = 'mock' } = req.body;

    if (!amount || amount <= 0) {
      return error(res, 400, '充值金额无效');
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.user!.id },
        data: { balance: { increment: Number(amount) } }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: TransactionType.RECHARGE,
          amount: Number(amount),
          balance: user.balance,
          remark: `充值 - ${payMethod === 'mock' ? '模拟支付' : payMethod}`
        }
      });

      return { user, transaction };
    });

    success(res, result, '充值成功');
  } catch (err) {
    error(res, 500, '充值失败');
  }
});

router.get('/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { type, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = { userId: req.user.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    success(res, {
      list: transactions,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    error(res, 500, '获取交易记录失败');
  }
});

router.get('/stats', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const [todayEarning, weekEarning, monthEarning, totalEarning, totalOrders] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId: req.user.id,
          type: TransactionType.EARNING,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          userId: req.user.id,
          type: TransactionType.EARNING,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          userId: req.user.id,
          type: TransactionType.EARNING,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          userId: req.user.id,
          type: TransactionType.EARNING
        },
        _sum: { amount: true }
      }),
      prisma.order.count({
        where: {
          proId: req.user.id,
          status: 'COMPLETED'
        }
      })
    ]);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { balance: true }
    });

    success(res, {
      balance: user?.balance || 0,
      todayEarning: todayEarning._sum.amount || 0,
      weekEarning: weekEarning._sum.amount || 0,
      monthEarning: monthEarning._sum.amount || 0,
      totalEarning: totalEarning._sum.amount || 0,
      totalOrders
    });
  } catch (err) {
    error(res, 500, '获取统计失败');
  }
});

router.post('/withdraw', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { amount, account, accountName } = req.body;

    if (!amount || amount < config.minWithdrawalAmount) {
      return error(res, 400, `提现金额不能少于${config.minWithdrawalAmount}元`);
    }

    if (amount > config.maxWithdrawalAmount) {
      return error(res, 400, `提现金额不能超过${config.maxWithdrawalAmount}元`);
    }

    if (!account || !accountName) {
      return error(res, 400, '请填写收款账户信息');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || user.balance < amount) {
      return error(res, 400, '余额不足');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: req.user!.id },
        data: { balance: { decrement: Number(amount) } }
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: req.user!.id,
          amount: Number(amount),
          account,
          accountName
        }
      });

      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: TransactionType.WITHDRAWAL,
          amount: -Number(amount),
          balance: updatedUser.balance,
          remark: `提现申请 - ${accountName}`
        }
      });

      return { withdrawal, balance: updatedUser.balance };
    });

    success(res, result, '提现申请已提交');
  } catch (err) {
    error(res, 500, '提现失败');
  }
});

router.get('/withdrawals', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = { userId: req.user.id };

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
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
    error(res, 500, '获取提现记录失败');
  }
});

export default router;
