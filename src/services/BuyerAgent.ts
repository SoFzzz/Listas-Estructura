import { type Requisition, type RFQ, RFQStatus, type Quote, QuoteStatus, type PurchaseOrder, OrderStatus } from "../models/types";

export class BuyerAgent {
  private name: string = "Buyer Agent";

  constructor() {}

  createRFQ(requisition: Requisition, requiresReview: boolean, logger: (msg: string, type?: string) => void): RFQ {
    const rfq: RFQ = {
      id: `RFQ-${Math.floor(Math.random() * 90000) + 10000}`,
      requisitionId: requisition.id,
      details: requisition.description,
      requiresReview,
      status: RFQStatus.PENDING,
    };
    logger(`[${this.name}] RFQ created: ${rfq.id}. Requires supervisor review: ${requiresReview}`, 'accent3');
    return rfq;
  }

  reviewQuote(quote: Quote, logger: (msg: string, type?: string) => void): Quote {
    logger(`[${this.name}] Reviewing quote ${quote.id} — amount $${quote.amount.toLocaleString()}`, 'accent3');

    // Simulate: accept if amount <= 10000
    const acceptable = quote.amount <= 10_000;

    if (acceptable) {
      quote.status = QuoteStatus.ACCEPTED;
      logger(`[${this.name}] Quote ACCEPTED ✓`, 'success');
    } else {
      quote.status = QuoteStatus.REJECTED_WITH_COMMENTS;
      quote.buyerComments = "Price exceeds budget. Please revise.";
      logger(`[${this.name}] Quote REJECTED — price exceeds budget. Sending comments to seller.`, 'warn');
    }

    return quote;
  }

  preparePurchaseOrder(quote: Quote, logger: (msg: string, type?: string) => void): PurchaseOrder {
    const po: PurchaseOrder = {
      id: `PO-${Math.floor(Math.random() * 90000) + 10000}`,
      quoteId: quote.id,
      items: [quote.details],
      totalAmount: quote.amount,
      status: OrderStatus.DRAFT,
    };
    logger(`[${this.name}] Purchase Order prepared: ${po.id} — Total: $${po.totalAmount.toLocaleString()}`, 'accent3');
    return po;
  }

  sendPurchaseOrder(po: PurchaseOrder, logger: (msg: string, type?: string) => void): PurchaseOrder {
    po.status = OrderStatus.SENT;
    logger(`[${this.name}] Purchase Order ${po.id} sent to seller.`, 'accent3');
    return po;
  }

  reviewRevisedQuote(quote: Quote, logger: (msg: string, type?: string) => void): Quote {
    logger(`[${this.name}] Reviewing revised quote... ACCEPTED ✓`, 'success');
    // After revision, always accept (simplified for demo)
    quote.status = QuoteStatus.ACCEPTED;
    return quote;
  }
}
