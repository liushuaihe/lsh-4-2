export const config = {
  port: parseInt(process.env.PORT || '3000'),
  jwtSecret: process.env.JWT_SECRET || 'game-boost-secret-key-2024',
  jwtExpiresIn: '7d' as any,
  platformFeeRate: 0.15,
  minWithdrawalAmount: 100,
  maxWithdrawalAmount: 10000
};
