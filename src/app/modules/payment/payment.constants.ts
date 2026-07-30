export const PAYMENT_CURRENCY = "BDT";

export const SSL_CONFIG = {
  initUrl: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
  validationUrl:
    "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
  currency: PAYMENT_CURRENCY,
} as const;
