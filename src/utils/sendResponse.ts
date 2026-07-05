import type { TResponse } from "../types/express.types";

type TMeta = {
  page: number;
  limit: number;
  total: number;
};
type TSendResponse<T> = {
  res: TResponse;
  status: number;
  success: boolean;
  message?: string;
  data?: T;
  meta?: TMeta;
};

export const sendResponse = <T>({
  res,
  status,
  success,
  message,
  data,
  meta,
}: TSendResponse<T>) => {
  return res.status(status).json({
    success,
    message,
    data,
    meta,
  });
};
