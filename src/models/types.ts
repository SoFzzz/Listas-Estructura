export const RFQStatus = {
  PENDING: "PENDING",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type RFQStatus = (typeof RFQStatus)[keyof typeof RFQStatus];

export const QuoteStatus = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  ACCEPTED: "ACCEPTED",
  REJECTED_WITH_COMMENTS: "REJECTED_WITH_COMMENTS",
  REVISED: "REVISED",
} as const;

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const OrderStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  NEEDS_ADJUSTMENT: "NEEDS_ADJUSTMENT",
  FULFILLED: "FULFILLED",
  DELIVERED: "DELIVERED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  INVOICED: "INVOICED",
  PAID: "PAID",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface Requisition {
  id: string;
  description: string;
  requestedBy: string;
  createdAt: Date;
}

export interface RFQ {
  id: string;
  requisitionId: string;
  details: string;
  requiresReview: boolean;
  status: RFQStatus;
  supervisorComments?: string;
}

export interface Quote {
  id: string;
  rfqId: string;
  sellerName: string;
  amount: number;
  details: string;
  status: QuoteStatus;
  buyerComments?: string;
  revision?: number;
}

export interface PurchaseOrder {
  id: string;
  quoteId: string;
  items: string[];
  totalAmount: number;
  status: OrderStatus;
  sellerFeedback?: string;
}

export interface DeliveryNote {
  orderId: string;
  receivedBy: string;
  receivedAt: Date;
  confirmed: boolean;
}

export interface Invoice {
  id: string;
  orderId: string;
  amount: number;
  issuedAt: Date;
  paymentStatus: PaymentStatus;
}
