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
  buildPaymentFilter,
  initSSLCommerzPayment,
  validateSSLCommerzPayment,
  verifySSLCommerzIPN,
} from "./payment.utils";
import config from "../../../config";
import { TRole, type Prisma } from "../../../../generated/prisma/client";
import type { TListPaymentsQuery } from "./payment.validation";
import { createFullName, getPagination } from "../../../utils/utils";
import {
  PAYMENT_CREATE_BOOKING_SELECT,
  PAYMENT_DETAILS_SELECT,
  PAYMENT_FAILURE_SELECT,
  PAYMENT_FINALIZE_SELECT,
  PAYMENT_GATEWAY_CUSTOMER_SELECT,
  PAYMENT_LIST_SELECT,
} from "./payment.include";
import { paymentDetailsMapper, paymentListMapper } from "./payment.mapper";
import {
  notifyPaymentFailed,
  notifyPaymentSuccess,
} from "../notification/notification.events";

export class PaymentService {
  //Get Payment List
  private async paymentLists(
    baseWhere: Prisma.PaymentWhereInput,
    query: TListPaymentsQuery,
  ) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where = buildPaymentFilter(baseWhere, query);
    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: PAYMENT_LIST_SELECT,
      }),
      prisma.payment.count({ where }),
    ]);

    const result = items.map((payment) => {
      return paymentListMapper(payment);
    });

    return {
      items: result,
      meta: { page, limit, total },
    };
  }

  //Finalize payment after gateway verification
  private async finalizePayment(
    transactionId: string,
    valId: string,
  ): Promise<boolean> {
    //get the payment
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      select: PAYMENT_FINALIZE_SELECT,
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

    const customerName = createFullName(
      payment.booking.customer.users.firstName,
      payment.booking.customer.users.lastName,
    );
    //sending notifications
    await notifyPaymentSuccess(
      payment.bookingId,
      String(payment.amount),
      customerName,
      payment.booking.customer.userId,
      payment.booking.technician.userId,
    );
    return true;
  }

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
      select: PAYMENT_CREATE_BOOKING_SELECT,
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
      select: PAYMENT_GATEWAY_CUSTOMER_SELECT,
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
      ipnUrl: `${config.url}/api/payments/ipn`,
      customerName: createFullName(user?.firstName, user?.lastName, "Customer"),
      customerEmail: user?.email ?? "customer@fixitnow.com",
      customerPhone: "01700000000",
      customerAddress: booking.address,
      productName: booking.service.title,
    });

    return { paymentUrl };
  }

  //-------------GATEWAY CALLBACKS----------
  //---------Success redirect (browser): verify + mark paid----------
  async handleSuccess(transactionId: string, valId: string): Promise<boolean> {
    return this.finalizePayment(transactionId, valId);
  }

  //---------IPN (server-to-server): source of truth----------
  async handleIPN(payload: Record<string, string>): Promise<void> {
    //authenticate : reject anything not actually from ssl
    if (!verifySSLCommerzIPN(payload)) {
      throw new AppError("Invalid IPN signature.", httpStatus.FORBIDDEN);
    }
    const tranId = payload.tran_id;
    const valId = payload.val_id;
    const status = payload.status;

    if (!tranId) {
      throw new AppError(
        "Missing transaction id in IPN.",
        httpStatus.BAD_REQUEST,
      );
    }

    if (status === "VALID") {
      //checking valId here because it only exists if the payment is succeeded
      if (!valId) {
        throw new AppError(
          "Missing validation id in IPN.",
          httpStatus.BAD_REQUEST,
        );
      }

      await this.finalizePayment(tranId, valId);
      return;
    }
    // FAILED / CANCELLED / EXPIRED / UNATTEMPTED
    await this.handleFailure(tranId);
  }

  //-----------Fail / Cancel: mark failed-----------
  async handleFailure(transactionId: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      select: PAYMENT_FAILURE_SELECT,
    });
    if (!payment || payment.status === TPaymentStatus.SUCCESS) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: TPaymentStatus.FAILED },
    });

    const customerName = createFullName(
      payment.booking.customer.users.firstName,
      payment.booking.customer.users.lastName,
    );

    //send notifications
    await notifyPaymentFailed(
      payment.bookingId,
      payment.booking.customer.userId,
      customerName,
    );
  }

  //----------Customer payment history-----------
  async getMyPaymentsList(userId: string, query: TListPaymentsQuery) {
    const customer = await findCustomerProfileByUserId(userId);
    return this.paymentLists({ customerId: customer.id }, query);
  }

  //--------------Get Payment details-------------
  async getPaymentDetails(userId: string, paymentId: string, role: TRole) {
    const where: Prisma.PaymentWhereInput = { id: paymentId };

    // customer sees only their own payment
    if (role === TRole.CUSTOMER) {
      const customer = await findCustomerProfileByUserId(userId);
      where.customerId = customer.id;
    } else if (role !== TRole.ADMIN) {
      throw new AppError(
        "You don't have permission to view this payment.",
        httpStatus.FORBIDDEN,
      );
    }
    const payment = await prisma.payment.findFirst({
      where,
      select: PAYMENT_DETAILS_SELECT,
    });

    if (!payment) {
      throw new AppError("Payment not found.", httpStatus.NOT_FOUND);
    }

    return paymentDetailsMapper(payment);
  }
  //-------------ADMIN ACTIONS----------
  //----------All payment history-----------
  async getAllPaymentLists(query: TListPaymentsQuery) {
    return this.paymentLists({}, query);
  }
}

export const paymentService = new PaymentService();
