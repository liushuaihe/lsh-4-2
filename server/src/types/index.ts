export const UserRole = {
  BOSS: 'BOSS',
  PRO: 'PRO',
  ADMIN: 'ADMIN'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const CertificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type CertificationStatus = typeof CertificationStatus[keyof typeof CertificationStatus];

export const CertificationType = {
  SKILL: 'SKILL',
  VOICE: 'VOICE'
} as const;

export type CertificationType = typeof CertificationType[keyof typeof CertificationType];

export const TransactionType = {
  RECHARGE: 'RECHARGE',
  ORDER_PAY: 'ORDER_PAY',
  ORDER_REFUND: 'ORDER_REFUND',
  EARNING: 'EARNING',
  WITHDRAWAL: 'WITHDRAWAL',
  WITHDRAWAL_FAILED: 'WITHDRAWAL_FAILED'
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const WithdrawalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type WithdrawalStatus = typeof WithdrawalStatus[keyof typeof WithdrawalStatus];
