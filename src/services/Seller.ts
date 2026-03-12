import { type RFQ, type Quote, QuoteStatus, type PurchaseOrder, OrderStatus, type Invoice, PaymentStatus } from "../models/types";

export class Seller {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  evaluateRFQ(rfq: RFQ, logger: (msg: string, type?: string) => void): boolean {
    logger(`[${this.name}] Evaluating RFQ: ${rfq.id}`, 'accent2');
    // Simulate: always decides to participate
    const willParticipate = true;
    logger(`[${this.name}] Decision: Will participate ✓`, 'accent2');
    return willParticipate;
  }

  prepareQuote(rfq: RFQ, amount: number, logger: (msg: string, type?: string) => void): Quote {
    const quote: Quote = {
      id: `QUOTE-${Math.floor(Math.random() * 90000) + 10000}`,
      rfqId: rfq.id,
      sellerName: this.name,
      amount,
      details: `Quote for: ${rfq.details}`,
      status: QuoteStatus.SUBMITTED,
      revision: 1,
    };
    logger(`[${this.name}] Quote prepared: ${quote.id} — $${amount.toLocaleString()}`, 'accent2');
    return quote;
  }

  analyzeQuoteResponse(quote: Quote, logger: (msg: string, type?: string) => void): Quote {
    logger(`[${this.name}] Analyzing buyer comments...`, 'accent2');
    // Revise with a lower price
    quote.amount = Math.round(quote.amount * 0.85);
    quote.status = QuoteStatus.REVISED;
    quote.revision = (quote.revision ?? 1) + 1;
    logger(`[${this.name}] Quote revised to $${quote.amount.toLocaleString()} (revision #${quote.revision})`, 'accent2');
    return quote;
  }

  reviewPurchaseOrder(po: PurchaseOrder, logger: (msg: string, type?: string) => void): PurchaseOrder {
    logger(`[${this.name}] Reviewing Purchase Order: ${po.id}`, 'accent2');
    // Simulate acceptance
    po.status = OrderStatus.ACCEPTED;
    logger(`[${this.name}] Purchase Order ACCEPTED ✓`, 'accent2');
    return po;
  }

  fulfillOrder(po: PurchaseOrder, logger: (msg: string, type?: string) => void): PurchaseOrder {
    po.status = OrderStatus.FULFILLED;
    logger(`[${this.name}] Order ${po.id} fulfilled and dispatched. 📦`, 'success');
    return po;
  }

  prepareInvoice(po: PurchaseOrder, logger: (msg: string, type?: string) => void): Invoice {
    const invoice: Invoice = {
      id: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
      orderId: po.id,
      amount: po.totalAmount,
      issuedAt: new Date(),
      paymentStatus: PaymentStatus.INVOICED,
    };
    logger(`[${this.name}] Invoice ${invoice.id} prepared for $${invoice.amount.toLocaleString()}`, 'accent2');
    return invoice;
  }

  receivePayment(invoice: Invoice, logger: (msg: string, type?: string) => void): Invoice {
    invoice.paymentStatus = PaymentStatus.PAID;
    logger(`[${this.name}] Payment received for invoice ${invoice.id}. Process COMPLETE ✅`, 'success');
    return invoice;
  }
}
