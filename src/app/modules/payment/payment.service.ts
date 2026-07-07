import httpStatus from "http-status";
import { randomUUID } from "node:crypto";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { findCustomerProfileByUserId } from "../customer/customer.utils";
import {
  TBookingStatus,
  TPaymentProvider,
  TPaymentStatus,
} from "../../../../generated/prisma/enums";
import {
  initSSLCommerzPayment,
  validateSSLCommerzPayment,
} from "./payment.utils";
import config from "../../../config";
import type { Prisma } from "../../../../generated/prisma/client";

export class PaymentService {
  //-------------CUSTOMER ACTIONS----------
  //---------Create Payment (init gateway)-----------

  async createPayment(userId: string, bookingId: string) {
    //get the customer
    const customer = await findCustomerProfileByUserId(userId);
    // booking must exist, be owned by this customer, and be ACCEPTED
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        customerId: true,
        status: true,
        amount: true,
        address: true,
        service: {
          select: { title: true },
        },
      },
    });
    if (!booking) {
      throw new AppError("Booking not found.", httpStatus.NOT_FOUND);
    }
    if (booking.customerId !== customer.id) {
      throw new AppError(
        "You can only pay for your own bookings.",
        httpStatus.FORBIDDEN,
      );
    }
    if (booking.status !== TBookingStatus.ACCEPTED) {
      throw new AppError(
        "Only accepted bookings can be paid.",
        httpStatus.BAD_REQUEST,
      );
    }

    // block double payment
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
      select: { status: true },
    });
    if (existingPayment?.status === TPaymentStatus.SUCCESS) {
      throw new AppError(
        "This booking is already paid.",
        httpStatus.BAD_REQUEST,
      );
    }

    // customer contact info required by the gateway
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    //generating transaction id
    const transactionId = randomUUID();

    // One payment row per booking
    await prisma.payment.upsert({
      where: { bookingId },
      update: {
        transactionId,
        amount: booking.amount,
        status: TPaymentStatus.PENDING,
        provider: TPaymentProvider.SSLCOMMERZ,
        valId: null,
        method: null,
        paidAt: null,
      },
      create: {
        bookingId,
        customerId: customer.id,
        amount: booking.amount,
        transactionId,
        provider: TPaymentProvider.SSLCOMMERZ,
        status: TPaymentStatus.PENDING,
      },
    });

    const paymentUrl = await initSSLCommerzPayment({
      transactionId,
      amount: Number(booking.amount),
      successUrl: `${config.url}/api/payments/success`,
      failUrl: `${config.url}/api/payments/fail`,
      cancelUrl: `${config.url}/api/payments/cancel`,
      customerName:
        `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Customer",
      customerEmail: user?.email ?? "customer@fixitnow.com",
      customerPhone: "01700000000",
      customerAddress: booking.address,
      productName: booking.service.title,
    });

    return { paymentUrl };
  }

  //-------------GATEWAY CALLBACKS----------
  //---------Success: verify + mark paid----------
  async handleSuccess(transactionId: string, valId: string): Promise<boolean> {
    //get the payment
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      select: {
        id: true,
        amount: true,
        status: true,
        bookingId: true,
        booking: {
          select: {
            customer: { select: { userId: true } },
          },
        },
      },
    });

    if (!payment) return false;

    //already processed - Idempotent
    if (payment.status === TPaymentStatus.SUCCESS) return true;

    // verify a completed transaction
    const validation = await validateSSLCommerzPayment(valId);
    const isValid =
      validation.status === "VALID" || validation.status === "VALIDATED";
    const amountMatches = Number(validation.amount) === Number(payment.amount);

    if (!isValid || !amountMatches) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: TPaymentStatus.FAILED },
      });
      return false;
    }

    // mark paid
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: TPaymentStatus.SUCCESS,
          valId,
          method: validation.card_type ?? null,
          paidAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: TBookingStatus.PAID,
          statusHistory: {
            create: {
              status: TBookingStatus.PAID,
              changedById: payment.booking.customer.userId,
            },
          },
        },
      }),
    ]);
    return true;
  }

  //-----------Fail / Cancel: mark failed-----------
  async handleFailure(transactionId: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      select: { id: true, status: true },
    });
    if (!payment || payment.status === TPaymentStatus.SUCCESS) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: TPaymentStatus.FAILED },
    });
  }

  //----------Customer payment history-----------
  //--------------Payment details-------------
}

export const paymentService = new PaymentService();
