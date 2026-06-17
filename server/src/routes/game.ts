import { Router } from 'express';
import prisma from '../prisma';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    const games = await prisma.game.findMany({
      where: {
        isActive: true,
        category: category as string | undefined
      },
      include: {
        _count: {
          select: { skills: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    success(res, games);
  } catch (err) {
    error(res, 500, '获取游戏列表失败');
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.game.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    success(res, categories.map(c => c.category));
  } catch (err) {
    error(res, 500, '获取分类失败');
  }
});

router.get('/:id/pros', async (req, res) => {
  try {
    const { id } = req.params;
    const { minPrice, maxPrice, rank, isCertified, sortBy, page = 1, pageSize = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {
      gameId: id,
      pro: {
        acceptOrders: true,
        isOnline: true
      }
    };

    if (minPrice) where.pricePerHour = { ...where.pricePerHour, gte: Number(minPrice) };
    if (maxPrice) where.pricePerHour = { ...where.pricePerHour, lte: Number(maxPrice) };
    if (rank) where.rank = { contains: rank as string };
    if (isCertified === 'true') where.isCertified = true;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price-asc') orderBy = { pricePerHour: 'asc' };
    if (sortBy === 'price-desc') orderBy = { pricePerHour: 'desc' };
    if (sortBy === 'rating') orderBy = { pro: { reviewsReceived: { _count: 'desc' } } };

    const [pros, total] = await Promise.all([
      prisma.proSkill.findMany({
        where,
        include: {
          pro: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isOnline: true,
              acceptOrders: true,
              certifications: {
                where: { status: 'APPROVED' },
                select: { type: true }
              },
              _count: {
                select: {
                  reviewsReceived: true,
                  proOrders: { where: { status: 'COMPLETED' } }
                }
              }
            }
          },
          game: true
        },
        skip,
        take,
        orderBy
      }),
      prisma.proSkill.count({ where })
    ]);

    const prosWithRating = await Promise.all(pros.map(async (skill) => {
      const reviews = await prisma.review.aggregate({
        where: { revieweeId: skill.proId },
        _avg: { rating: true }
      });

      return {
        ...skill,
        pro: {
          ...skill.pro,
          avgRating: reviews._avg.rating || 0,
          reviewCount: skill.pro._count.reviewsReceived,
          orderCount: skill.pro._count.proOrders
        }
      };
    }));

    success(res, {
      list: prosWithRating,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, 500, '获取大神列表失败');
  }
});

router.get('/pro/:proId', async (req, res) => {
  try {
    const { proId } = req.params;

    const pro = await prisma.user.findUnique({
      where: { id: proId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        isOnline: true,
        acceptOrders: true,
        createdAt: true,
        skills: {
          include: { game: true },
          where: { isCertified: true }
        },
        certifications: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            type: true,
            evidence: true,
            remark: true,
            reviewedAt: true
          }
        }
      }
    });

    if (!pro) {
      return error(res, 404, '大神不存在');
    }

    const [stats, reviews] = await Promise.all([
      prisma.review.aggregate({
        where: { revieweeId: proId },
        _avg: { rating: true },
        _count: true
      }),
      prisma.review.findMany({
        where: { revieweeId: proId },
        include: {
          reviewer: {
            select: { id: true, nickname: true, avatar: true }
          },
          order: {
            select: { game: true }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({
        where: { proId, status: 'COMPLETED' }
      })
    ]);

    success(res, {
      ...pro,
      avgRating: stats._avg.rating || 0,
      reviewCount: stats._count,
      completedOrderCount: 123
    });
  } catch (err) {
    console.error(err);
    error(res, 500, '获取大神详情失败');
  }
});

router.post('/skill', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { gameId, rank, pricePerHour, description } = req.body;

    const existing = await prisma.proSkill.findUnique({
      where: {
        proId_gameId: {
          proId: req.user.id,
          gameId
        }
      }
    });

    if (existing) {
      return error(res, 400, '该游戏技能已存在');
    }

    const skill = await prisma.proSkill.create({
      data: {
        proId: req.user.id,
        gameId,
        rank,
        pricePerHour: Number(pricePerHour),
        description
      },
      include: { game: true }
    });

    success(res, skill, '技能添加成功');
  } catch (err) {
    error(res, 500, '添加失败');
  }
});

router.put('/skill/:id', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { rank, pricePerHour, description } = req.body;

    const skill = await prisma.proSkill.findUnique({
      where: { id }
    });

    if (!skill || skill.proId !== req.user.id) {
      return error(res, 403, '无权限修改');
    }

    const updated = await prisma.proSkill.update({
      where: { id },
      data: {
        rank: rank || undefined,
        pricePerHour: pricePerHour ? Number(pricePerHour) : undefined,
        description: description || undefined
      },
      include: { game: true }
    });

    success(res, updated, '更新成功');
  } catch (err) {
    error(res, 500, '更新失败');
  }
});

router.get('/my/skills', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const skills = await prisma.proSkill.findMany({
      where: { proId: req.user.id },
      include: { game: true },
      orderBy: { createdAt: 'desc' }
    });

    success(res, skills);
  } catch (err) {
    error(res, 500, '获取技能列表失败');
  }
});

export default router;
