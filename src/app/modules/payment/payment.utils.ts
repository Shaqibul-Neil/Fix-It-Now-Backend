import httpStatus from "http-status";
import crypto from "node:crypto";
import axios from "axios";
import config from "../../../config";
import { SSL_CONFIG } from "./payment.constants";
import { AppError } from "../../../utils/appError";
import type { Prisma } from "../../../../generated/prisma/client";
import type { TListPaymentsQuery } from "./payment.validation";
import { getDateFromPeriod } from "../../../utils/utils";

type TInitInput = {
  transactionId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
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

type TIpnPayload = Record<string, string>;

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
    ipn_url: input.ipnUrl,
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

// Verify IPN
export const verifySSLCommerzIPN = (payload: TIpnPayload): boolean => {
  console.log("--------payload---", payload);
  const { verify_sign, verify_key } = payload;
  if (!verify_sign || !verify_key) return false;

  console.log("--------verify_sign---", verify_sign);
  console.log("--------verify_key---", verify_key);

  const signedKeys = verify_key.split(",");
  const data: Record<string, string> = {};
  for (const key of signedKeys) {
    if (payload[key] !== undefined) {
      data[key] = payload[key];
      console.log(`After adding ${key}:`, data);
    }
  }
  // MD5 hash generate + store password as input = MD5 hash hexadecimal string
  console.log("------data after loop------", data);
  data.store_passwd = crypto
    .createHash("md5")
    .update(config.ssl.store_passwd)
    .digest("hex");
  console.log("------data after hash------", data);

  //making a query string from object
  const hashString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
  console.log("------hashString------", hashString);

  //converting the query string to md5
  const expected = crypto.createHash("md5").update(hashString).digest("hex");

  console.log("------expected------", expected);
  return expected === verify_sign;
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
    ...(query.period && {
      createdAt: {
        gte: getDateFromPeriod(query.period),
      },
    }),
  };
};
