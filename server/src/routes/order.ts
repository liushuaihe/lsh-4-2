import { Router } from 'express';
import prisma from '../prisma';
import { config } from '../config';
import { success, error, generateOrderNo } from '../utils/response';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { OrderStatus, UserRole, TransactionType } from '../types';

const router = Router();

router.post('/', authMiddleware, roleMiddleware(UserRole.BOSS), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { proId, gameId, skillId, duration, requirement } = req.body;

    const skill = await prisma.proSkill.findUnique({
      where: { id: skillId },
      include: { pro: true, game: true }
    });

    if (!skill) {
      return error(res, 404, '技能不存在');
    }

    if (!skill.pro.acceptOrders) {
      return error(res, 400, '大神暂不接单');
    }

    const amount = skill.pricePerHour * duration;
    const orderNo = generateOrderNo();

    const order = await prisma.order.create({
      data: {
        orderNo,
        bossId: req.user.id,
        proId,
        gameId,
        skillId,
        duration: Number(duration),
        amount,
        requirement,
        statusLogs: {
          create: {
            status: OrderStatus.PENDING,
            remark: '订单创建'
          }
        }
      },
      include: {
        boss: { select: { id: true, nickname: true, avatar: true } },
        pro: { select: { id: true, nickname: true, avatar: true } },
        game: true,
        skill: true,
        statusLogs: { orderBy: { createdAt: 'asc' } }
      }
    });

    success(res, order, '订单创建成功');
  } catch (err) {
    console.error(err);
    error(res, 500, '创建订单失败');
  }
});

router.post('/:id/pay', authMiddleware, roleMiddleware(UserRole.BOSS), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { payMethod = 'balance' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return error(res, 404, '订单不存在');
    }

    if (order.bossId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (order.status !== OrderStatus.PENDING) {
      return error(res, 400, '订单状态不正确');
    }

    const boss = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!boss || boss.balance < order.amount) {
      return error(res, 400, '余额不足，请先充值');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBoss = await tx.user.update({
        where: { id: req.user!.id },
        data: { balance: { decrement: order.amount } }
      });

      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: TransactionType.ORDER_PAY,
          amount: -order.amount,
          balance: updatedBoss.balance,
          orderId: order.id,
          remark: `订单支付 - ${order.orderNo}`
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date()
        },
        include: {
          boss: { select: { id: true, nickname: true, avatar: true } },
          pro: { select: { id: true, nickname: true, avatar: true } },
          game: true,
          skill: true,
          statusLogs: { orderBy: { createdAt: 'asc' } }
        }
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PAID,
          remark: '支付成功'
        }
      });

      return updatedOrder;
    });

    success(res, result, '支付成功');
  } catch (err) {
    console.error(err);
    error(res, 500, '支付失败');
  }
});

router.post('/:id/accept', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return error(res, 404, '订单不存在');
    }

    if (order.proId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (order.status !== OrderStatus.PAID) {
      return error(res, 400, '订单状态不正确');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const orderUpd = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ACCEPTED,
          acceptedAt: new Date()
        },
        include: {
          boss: { select: { id: true, nickname: true, avatar: true } },
          pro: { select: { id: true, nickname: true, avatar: true } },
          game: true,
          skill: true,
          statusLogs: { orderBy: { createdAt: 'asc' } }
        }
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: OrderStatus.ACCEPTED,
          remark: '大神已接单'
        }
      });

      return orderUpd;
    });

    success(res, updatedOrder, '接单成功');
  } catch (err) {
    error(res, 500, '接单失败');
  }
});

router.post('/:id/start', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order || order.proId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (order.status !== OrderStatus.ACCEPTED) {
      return error(res, 400, '订单状态不正确');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const orderUpd = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.IN_PROGRESS,
          startedAt: new Date(),
          progress: '服务进行中'
        },
        include: {
          boss: { select: { id: true, nickname: true, avatar: true } },
          pro: { select: { id: true, nickname: true, avatar: true } },
          game: true,
          skill: true,
          statusLogs: { orderBy: { createdAt: 'asc' } }
        }
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: OrderStatus.IN_PROGRESS,
          remark: '服务开始'
        }
      });

      return orderUpd;
    });

    success(res, updatedOrder, '服务已开始');
  } catch (err) {
    error(res, 500, '操作失败');
  }
});

router.put('/:id/progress', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { progress } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order || order.proId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      return error(res, 400, '订单状态不正确');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { progress },
      include: {
        boss: { select: { id: true, nickname: true, avatar: true } },
        pro: { select: { id: true, nickname: true, avatar: true } },
        game: true,
        skill: true,
        statusLogs: { orderBy: { createdAt: 'asc' } }
      }
    });

    success(res, updatedOrder, '进度已更新');
  } catch (err) {
    error(res, 500, '更新失败');
  }
});

router.post('/:id/complete', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { progress } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order || order.proId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      return error(res, 400, '订单状态不正确');
    }

    const earning = order.amount * (1 - config.platformFeeRate);

    const result = await prisma.$transaction(async (tx) => {
      const updatedPro = await tx.user.update({
        where: { id: order.proId },
        data: { balance: { increment: earning } }
      });

      await tx.transaction.create({
        data: {
          userId: order.proId,
          type: TransactionType.EARNING,
          amount: earning,
          balance: updatedPro.balance,
          orderId: order.id,
          remark: `订单收益 - ${order.orderNo}（平台抽成${config.platformFeeRate * 100}%）`
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
          progress: progress || '服务已完成'
        },
        include: {
          boss: { select: { id: true, nickname: true, avatar: true } },
          pro: { select: { id: true, nickname: true, avatar: true } },
          game: true,
          skill: true,
          statusLogs: { orderBy: { createdAt: 'asc' } }
        }
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: OrderStatus.COMPLETED,
          remark: '服务完成'
        }
      });

      return updatedOrder;
    });

    success(res, result, '订单已完成');
  } catch (err) {
    console.error(err);
    error(res, 500, '操作失败');
  }
});

router.post('/:id/cancel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return error(res, 404, '订单不存在');
    }

    if (order.bossId !== req.user.id && order.proId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (![OrderStatus.PENDING, OrderStatus.PAID].includes(order.status as any)) {
      return error(res, 400, '当前状态无法取消');
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedOrder;

      if (order.status === OrderStatus.PAID) {
        const boss = await tx.user.update({
          where: { id: order.bossId },
          data: { balance: { increment: order.amount } }
        });

        await tx.transaction.create({
          data: {
            userId: order.bossId,
            type: TransactionType.ORDER_REFUND,
            amount: order.amount,
            balance: boss.balance,
            orderId: order.id,
            remark: `订单退款 - ${order.orderNo}`
          }
        });

        updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.REFUNDED,
            cancelledAt: new Date()
          }
        });

        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            status: OrderStatus.REFUNDED,
            remark: '订单已取消，已退款'
          }
        });
      } else {
        updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date()
          }
        });

        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            status: OrderStatus.CANCELLED,
            remark: '订单已取消'
          }
        });
      }

      return updatedOrder;
    });

    success(res, result, '订单已取消');
  } catch (err) {
    error(res, 500, '取消失败');
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { status, page = 1, pageSize = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {};

    if (req.user.role === UserRole.BOSS) {
      where.bossId = req.user.id;
    } else if (req.user.role === UserRole.PRO) {
      where.proId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          boss: { select: { id: true, nickname: true, avatar: true } },
          pro: { select: { id: true, nickname: true, avatar: true } },
          game: true,
          skill: true,
          review: true
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

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        boss: { select: { id: true, nickname: true, avatar: true, phone: true } },
        pro: { select: { id: true, nickname: true, avatar: true, phone: true } },
        game: true,
        skill: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        review: {
          include: {
            reviewer: { select: { id: true, nickname: true, avatar: true } }
          }
        }
      }
    });

    if (!order) {
      return error(res, 404, '订单不存在');
    }

    if (order.bossId !== req.user.id && order.proId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return error(res, 403, '无权限查看');
    }

    success(res, order);
  } catch (err) {
    error(res, 500, '获取订单详情失败');
  }
});

router.post('/:id/review', authMiddleware, roleMiddleware(UserRole.BOSS), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { rating, content } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order || order.bossId !== req.user.id) {
      return error(res, 403, '无权限操作');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      return error(res, 400, '订单未完成');
    }

    const existingReview = await prisma.review.findUnique({
      where: { orderId: id }
    });

    if (existingReview) {
      return error(res, 400, '已评价过');
    }

    const review = await prisma.review.create({
      data: {
        orderId: id,
        reviewerId: req.user.id,
        revieweeId: order.proId,
        rating: Number(rating),
        content
      },
      include: {
        reviewer: { select: { id: true, nickname: true, avatar: true } }
      }
    });

    success(res, review, '评价成功');
  } catch (err) {
    error(res, 500, '评价失败');
  }
});

export default router;
