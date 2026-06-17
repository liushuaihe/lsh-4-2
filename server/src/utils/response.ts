import { Response } from 'express';

export const success = (res: Response, data: any, message: string = 'success') => {
  res.json({
    code: 200,
    message,
    data
  });
};

export const error = (res: Response, code: number, message: string) => {
  res.status(code).json({
    code,
    message,
    data: null
  });
};

export const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${year}${month}${day}${random}`;
};
