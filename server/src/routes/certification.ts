import { Router } from 'express';
import prisma from '../prisma';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { CertificationType, CertificationStatus, UserRole } from '../types';

const router = Router();

router.post('/', authMiddleware, roleMiddleware(UserRole.PRO), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { type, evidence, remark } = req.body;

    if (!type || !['SKILL', 'VOICE'].includes(type)) {
      return error(res, 400, '认证类型无效');
    }

    if (!evidence) {
      return error(res, 400, '请上传证明材料');
    }

    const existing = await prisma.certification.findFirst({
      where: {
        userId: req.user.id,
        type: type as CertificationType,
        status: CertificationStatus.PENDING
      }
    });

    if (existing) {
      return error(res, 400, '已有待审核的认证申请');
    }

    const certification = await prisma.certification.create({
      data: {
        userId: req.user.id,
        type: type as CertificationType,
        evidence,
        remark
      }
    });

    success(res, certification, '申请已提交');
  } catch (err) {
    error(res, 500, '提交失败');
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const certifications = await prisma.certification.findMany({
      where: { userId: req.user.id },
      include: {
        reviewer: { select: { id: true, nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    success(res, certifications);
  } catch (err) {
    error(res, 500, '获取认证记录失败');
  }
});

router.put('/:id/review', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return error(res, 400, '审核状态无效');
    }

    const certification = await prisma.certification.findUnique({
      where: { id }
    });

    if (!certification) {
      return error(res, 404, '认证申请不存在');
    }

    if (certification.status !== CertificationStatus.PENDING) {
      return error(res, 400, '该申请已审核');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.certification.update({
        where: { id },
        data: {
          status: status as CertificationStatus,
          reviewerId: req.user!.id,
          reviewedAt: new Date(),
          remark: remark || undefined
        }
      });

      if (status === 'APPROVED' && updated.type === CertificationType.SKILL) {
        await tx.proSkill.updateMany({
          where: { proId: updated.userId },
          data: { isCertified: true }
        });
      }

      return updated;
    });

    success(res, result, '审核完成');
  } catch (err) {
    error(res, 500, '审核失败');
  }
});

router.get('/', authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {};
    if (status) where.status = status;

    const [certifications, total] = await Promise.all([
      prisma.certification.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
          reviewer: { select: { id: true, nickname: true } }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.certification.count({ where })
    ]);

    success(res, {
      list: certifications,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    error(res, 500, '获取认证列表失败');
  }
});

export default router;
