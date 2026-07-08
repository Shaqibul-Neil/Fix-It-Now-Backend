import httpStatus from "http-status";
import axios from "axios";
import config from "../../../config";
import { SSL_CONFIG } from "./payment.constants";
import { AppError } from "../../../utils/appError";
import type { Prisma } from "../../../../generated/prisma/client";
import type { TListPaymentsQuery } from "./payment.validation";

type TInitInput = {
  transactionId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
};

type TSSLInitResponse = {
  status?: string;
  GatewayPageURL?: string;
  failedreason?: string;
};

type TSSLValidationResponse = {
  status?: string;
  tran_id?: string;
  amount?: string;
  card_type?: string;
};

// Ask SSLCommerz for a hosted payment page, return its URL.
export const initSSLCommerzPayment = async (
  input: TInitInput,
): Promise<string> => {
  const body = new URLSearchParams({
    store_id: config.ssl.store_id,
    store_passwd: config.ssl.store_passwd,
    total_amount: input.amount.toString(),
    currency: SSL_CONFIG.currency,
    tran_id: input.transactionId,
    success_url: input.successUrl,
    fail_url: input.failUrl,
    cancel_url: input.cancelUrl,
    cus_name: input.customerName,
    cus_email: input.customerEmail,
    cus_add1: input.customerAddress,
    cus_country: "Bangladesh",
    cus_phone: input.customerPhone,
    shipping_method: "NO",
    product_name: input.productName,
    product_category: "Service",
    product_profile: "general",
    num_of_item: "1",
  });

  const { data } = await axios.post<TSSLInitResponse>(
    SSL_CONFIG.initUrl,
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
    throw new AppError(
      data.failedreason || "Failed to initialize payment gateway.",
      httpStatus.BAD_GATEWAY,
    );
  }
  return data.GatewayPageURL;
};

// Verify a completed transaction
export const validateSSLCommerzPayment = async (valId: string) => {
  const { data } = await axios.get<TSSLValidationResponse>(
    SSL_CONFIG.validationUrl,
    {
      params: {
        val_id: valId,
        store_id: config.ssl.store_id,
        store_passwd: config.ssl.store_passwd,
        format: "json",
      },
    },
  );
  return data;
};

//Build Payment Queries
export const buildPaymentFilter = (
  baseWhere: Prisma.PaymentWhereInput,
  query: TListPaymentsQuery,
): Prisma.PaymentWhereInput => {
  return {
    ...baseWhere,
    ...(query.status && {
      status: query.status,
    }),
  };
};
