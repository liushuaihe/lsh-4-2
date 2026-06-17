import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      nickname: '管理员',
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    }
  });

  const boss1 = await prisma.user.upsert({
    where: { username: 'boss1' },
    update: {},
    create: {
      username: 'boss1',
      password: hashedPassword,
      nickname: '土豪老板',
      role: 'BOSS',
      balance: 10000,
      phone: '13800138001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=boss1'
    }
  });

  const boss2 = await prisma.user.upsert({
    where: { username: 'boss2' },
    update: {},
    create: {
      username: 'boss2',
      password: hashedPassword,
      nickname: '电竞爱好者',
      role: 'BOSS',
      balance: 5000,
      phone: '13800138002',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=boss2'
    }
  });

  const pro1 = await prisma.user.upsert({
    where: { username: 'pro1' },
    update: {},
    create: {
      username: 'pro1',
      password: hashedPassword,
      nickname: '王者大神',
      role: 'PRO',
      balance: 2000,
      phone: '13900139001',
      acceptOrders: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro1'
    }
  });

  const pro2 = await prisma.user.upsert({
    where: { username: 'pro2' },
    update: {},
    create: {
      username: 'pro2',
      password: hashedPassword,
      nickname: '吃鸡狂魔',
      role: 'PRO',
      balance: 3500,
      phone: '13900139002',
      acceptOrders: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro2'
    }
  });

  const pro3 = await prisma.user.upsert({
    where: { username: 'pro3' },
    update: {},
    create: {
      username: 'pro3',
      password: hashedPassword,
      nickname: 'LOL宗师',
      role: 'PRO',
      balance: 1800,
      phone: '13900139003',
      acceptOrders: false,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro3'
    }
  });

  const games = await Promise.all([
    prisma.game.upsert({
      where: { id: 'game-1' },
      update: {},
      create: {
        id: 'game-1',
        name: '王者荣耀',
        icon: '🎮',
        category: 'MOBA',
        description: '国民级MOBA手游'
      }
    }),
    prisma.game.upsert({
      where: { id: 'game-2' },
      update: {},
      create: {
        id: 'game-2',
        name: '和平精英',
        icon: '🔫',
        category: 'FPS',
        description: '战术竞技类手游'
      }
    }),
    prisma.game.upsert({
      where: { id: 'game-3' },
      update: {},
      create: {
        id: 'game-3',
        name: '英雄联盟',
        icon: '⚔️',
        category: 'MOBA',
        description: '经典MOBA端游'
      }
    }),
    prisma.game.upsert({
      where: { id: 'game-4' },
      update: {},
      create: {
        id: 'game-4',
        name: '原神',
        icon: '🌟',
        category: 'RPG',
        description: '开放世界冒险游戏'
      }
    }),
    prisma.game.upsert({
      where: { id: 'game-5' },
      update: {},
      create: {
        id: 'game-5',
        name: 'CSGO',
        icon: '💣',
        category: 'FPS',
        description: '经典竞技射击游戏'
      }
    })
  ]);

  await prisma.proSkill.upsert({
    where: { id: 'skill-1' },
    update: {},
    create: {
      id: 'skill-1',
      proId: pro1.id,
      gameId: games[0].id,
      rank: '荣耀王者100星',
      pricePerHour: 50,
      description: '国服打野，带飞全场，可语音陪玩',
      isCertified: true
    }
  });

  await prisma.proSkill.upsert({
    where: { id: 'skill-2' },
    update: {},
    create: {
      id: 'skill-2',
      proId: pro1.id,
      gameId: games[2].id,
      rank: '最强王者',
      pricePerHour: 80,
      description: 'LOL老玩家，中单法王',
      isCertified: true
    }
  });

  await prisma.proSkill.upsert({
    where: { id: 'skill-3' },
    update: {},
    create: {
      id: 'skill-3',
      proId: pro2.id,
      gameId: games[1].id,
      rank: '无敌战神',
      pricePerHour: 60,
      description: '专业吃鸡，钢枪选手，KD5.0+',
      isCertified: true
    }
  });

  await prisma.proSkill.upsert({
    where: { id: 'skill-4' },
    update: {},
    create: {
      id: 'skill-4',
      proId: pro3.id,
      gameId: games[2].id,
      rank: '宗师',
      pricePerHour: 70,
      description: '上单霸主，专治各种不服',
      isCertified: false
    }
  });

  await prisma.proSkill.upsert({
    where: { id: 'skill-5' },
    update: {},
    create: {
      id: 'skill-5',
      proId: pro2.id,
      gameId: games[4].id,
      rank: '大地球',
      pricePerHour: 100,
      description: 'CSGO职业选手，AWP绝活哥',
      isCertified: true
    }
  });

  await prisma.certification.upsert({
    where: { id: 'cert-1' },
    update: {},
    create: {
      id: 'cert-1',
      userId: pro1.id,
      type: 'SKILL',
      status: 'APPROVED',
      evidence: '王者截图_20240101.jpg',
      remark: '国服打野认证',
      reviewerId: admin.id,
      reviewedAt: new Date('2024-01-15')
    }
  });

  await prisma.certification.upsert({
    where: { id: 'cert-2' },
    update: {},
    create: {
      id: 'cert-2',
      userId: pro1.id,
      type: 'VOICE',
      status: 'APPROVED',
      evidence: 'voice_sample_pro1.mp3',
      remark: '优质男音，普通话标准',
      reviewerId: admin.id,
      reviewedAt: new Date('2024-01-16')
    }
  });

  await prisma.certification.upsert({
    where: { id: 'cert-3' },
    update: {},
    create: {
      id: 'cert-3',
      userId: pro2.id,
      type: 'SKILL',
      status: 'APPROVED',
      evidence: '吃鸡截图_20240102.jpg',
      remark: '无敌战神认证',
      reviewerId: admin.id,
      reviewedAt: new Date('2024-01-18')
    }
  });

  await prisma.certification.upsert({
    where: { id: 'cert-4' },
    update: {},
    create: {
      id: 'cert-4',
      userId: pro3.id,
      type: 'SKILL',
      status: 'PENDING',
      evidence: 'lol_rank.jpg',
      remark: '申请LOL宗师认证'
    }
  });

  const order1 = await prisma.order.upsert({
    where: { id: 'order-1' },
    update: {},
    create: {
      id: 'order-1',
      orderNo: 'ORD202401010001',
      bossId: boss1.id,
      proId: pro1.id,
      gameId: games[0].id,
      skillId: 'skill-1',
      duration: 3,
      amount: 150,
      status: 'COMPLETED',
      requirement: '带我上星，玩打野位',
      progress: '已完成，成功上星5颗',
      paidAt: new Date('2024-01-20T10:00:00'),
      acceptedAt: new Date('2024-01-20T10:05:00'),
      startedAt: new Date('2024-01-20T10:10:00'),
      completedAt: new Date('2024-01-20T13:10:00')
    }
  });

  const logData = [
    { id: 'log-1', orderId: order1.id, status: 'PENDING', remark: '订单创建' },
    { id: 'log-2', orderId: order1.id, status: 'PAID', remark: '支付成功' },
    { id: 'log-3', orderId: order1.id, status: 'ACCEPTED', remark: '大神已接单' },
    { id: 'log-4', orderId: order1.id, status: 'IN_PROGRESS', remark: '服务开始' },
    { id: 'log-5', orderId: order1.id, status: 'COMPLETED', remark: '服务完成' }
  ];
  for (const log of logData) {
    await prisma.orderStatusLog.upsert({
      where: { id: log.id },
      update: {},
      create: log
    });
  }

  const txData = [
    {
      id: 'tx-1',
      userId: boss1.id,
      type: 'RECHARGE',
      amount: 500,
      balance: 500,
      remark: '微信充值'
    },
    {
      id: 'tx-2',
      userId: boss1.id,
      type: 'ORDER_PAY',
      amount: -150,
      balance: 350,
      orderId: order1.id,
      remark: '订单支付'
    },
    {
      id: 'tx-3',
      userId: pro1.id,
      type: 'EARNING',
      amount: 127.5,
      balance: 127.5,
      orderId: order1.id,
      remark: '订单收益（平台抽成15%）'
    }
  ];
  for (const tx of txData) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: tx
    });
  }

  await prisma.review.upsert({
    where: { id: 'review-1' },
    update: {},
    create: {
      id: 'review-1',
      orderId: order1.id,
      reviewerId: boss1.id,
      revieweeId: pro1.id,
      rating: 5,
      content: '大神技术非常好，带我一路连胜，语音沟通也很顺畅，下次还会点！'
    }
  });

  console.log('数据库初始化完成！');
  console.log('测试账号:');
  console.log('  管理员: admin / 123456');
  console.log('  老板: boss1 / 123456, boss2 / 123456');
  console.log('  大神: pro1 / 123456, pro2 / 123456, pro3 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
