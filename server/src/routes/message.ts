import { Router } from 'express';
import prisma from '../prisma';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/conversations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const conversations = await prisma.$queryRaw`
      SELECT 
        CASE WHEN senderId = ${req.user.id} THEN receiverId ELSE senderId END as otherUserId,
        MAX(createdAt) as lastMessageTime
      FROM Message
      WHERE senderId = ${req.user.id} OR receiverId = ${req.user.id}
      GROUP BY otherUserId
      ORDER BY lastMessageTime DESC
    ` as any[];

    const result = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherUser = await prisma.user.findUnique({
          where: { id: conv.otherUserId },
          select: { id: true, nickname: true, avatar: true, isOnline: true }
        });

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: req.user!.id, receiverId: conv.otherUserId },
              { senderId: conv.otherUserId, receiverId: req.user!.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: conv.otherUserId,
            receiverId: req.user!.id,
            isRead: false
          }
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount
        };
      })
    );

    success(res, result);
  } catch (err) {
    console.error(err);
    error(res, 500, '获取会话列表失败');
  }
});

router.get('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { userId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
        receiver: { select: { id: true, nickname: true, avatar: true } }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatar: true, isOnline: true }
    });

    success(res, {
      messages: messages.reverse(),
      otherUser
    });
  } catch (err) {
    error(res, 500, '获取消息失败');
  }
});

router.post('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const { userId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return error(res, 400, '消息内容不能为空');
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!otherUser) {
      return error(res, 404, '用户不存在');
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: userId,
        content: content.trim()
      },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
        receiver: { select: { id: true, nickname: true, avatar: true } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('newMessage', message);
      io.to(req.user.id).emit('newMessage', message);
    }

    success(res, message, '发送成功');
  } catch (err) {
    error(res, 500, '发送失败');
  }
});

router.get('/unread/count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return error(res, 401, '请先登录');
    }

    const count = await prisma.message.count({
      where: {
        receiverId: req.user.id,
        isRead: false
      }
    });

    success(res, { count });
  } catch (err) {
    error(res, 500, '获取未读消息数失败');
  }
});

export default router;
