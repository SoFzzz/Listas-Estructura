import { ShippingOffice } from "./ShippingOffice";
import { Supervisor } from "./Supervisor";
import { BuyerAgent } from "./BuyerAgent";
import { Seller } from "./Seller";
import { ReceiveAgent } from "./ReceiveAgent";
import { RFQStatus, QuoteStatus } from "../models/types";

export interface ProcessCallbacks {
  logger: (msg: string, type?: string) => void;
  sleep: () => Promise<void>;
  setPhase: (num: number, state: string) => void;
  activateCard: (cardId: string) => void;
  updateCard: (idEl: string, detailEl: string, badgeEl: string, id: string, detail: string, badgeClass: string, badgeText: string) => void;
  showResult: (success: boolean, text: string) => void;
  onFinish: () => void;
}

export class ProcurementProcess {
  private shippingOffice: ShippingOffice;
  private supervisor: Supervisor;
  private buyerAgent: BuyerAgent;
  private seller: Seller;
  private receiveAgent: ReceiveAgent;
  private cb: ProcessCallbacks;

  constructor(sellerName: string, callbacks: ProcessCallbacks) {
    this.shippingOffice = new ShippingOffice();
    this.supervisor = new Supervisor();
    this.buyerAgent = new BuyerAgent();
    this.seller = new Seller(sellerName);
    this.receiveAgent = new ReceiveAgent();
    this.cb = callbacks;
  }

  async run(itemDescription: string, requiresReview: boolean, initialQuoteAmount: number, supervisorRejects: boolean): Promise<void> {
    const { logger, sleep, setPhase, activateCard, updateCard, showResult, onFinish } = this.cb;

    // ===================== PHASE 1 =====================
    setPhase(1, 'active');
    logger('─── PHASE 1: Requisition & RFQ ───', 'section');
    await sleep();

    const requisition = this.shippingOffice.generateRequisition(itemDescription, logger);
    activateCard('card-req');
    updateCard('req-id', 'req-detail', 'req-badge', requisition.id, itemDescription, 'badge-ok', 'Issued');
    await sleep();

    const rfq = this.buyerAgent.createRFQ(requisition, requiresReview, logger);
    activateCard('card-rfq');
    await sleep();

    if (requiresReview) {
      logger(`[Buyer Agent] Routing RFQ to Supervisor for review...`, 'accent3');
      await sleep();
      
      const reviewedRfq = this.supervisor.reviewRFQ(rfq, logger, supervisorRejects);
      await sleep();

      if (reviewedRfq.status === RFQStatus.REJECTED) {
        updateCard('rfq-id', 'rfq-detail', 'rfq-badge', rfq.id, `Rejected by Supervisor`, 'badge-fail', 'Rejected');
        setPhase(1, 'failed');
        showResult(false, 'RFQ rejected by Supervisor. Process must restart from the beginning.');
        onFinish();
        return;
      } else {
        updateCard('rfq-id', 'rfq-detail', 'rfq-badge', rfq.id, `Approved — ${itemDescription}`, 'badge-ok', 'Approved');
      }
    } else {
      logger(`[Buyer Agent] RFQ ${rfq.id} sent directly to seller (no review needed).`, 'accent3');
      updateCard('rfq-id', 'rfq-detail', 'rfq-badge', rfq.id, itemDescription, 'badge-info', 'Sent to Seller');
    }

    setPhase(1, 'done');
    await sleep();

    // ===================== PHASE 2 =====================
    setPhase(2, 'active');
    logger('─── PHASE 2: Quote Negotiation ───', 'section');
    await sleep();

    const willParticipate = this.seller.evaluateRFQ(rfq, logger);
    await sleep();
    if (!willParticipate) {
      onFinish();
      return;
    }

    let quote = this.seller.prepareQuote(rfq, initialQuoteAmount, logger);
    activateCard('card-quote');
    await sleep();

    quote = this.buyerAgent.reviewQuote(quote, logger);
    await sleep();

    if (quote.status === QuoteStatus.REJECTED_WITH_COMMENTS) {
      updateCard('quote-id', 'quote-detail', 'quote-badge', quote.id,
        `$${initialQuoteAmount.toLocaleString()} — Over budget`, 'badge-fail', 'Rejected');
      await sleep();

      quote = this.seller.analyzeQuoteResponse(quote, logger);
      await sleep();
      
      quote = this.buyerAgent.reviewRevisedQuote(quote, logger);
      updateCard('quote-id', 'quote-detail', 'quote-badge', quote.id,
        `$${quote.amount.toLocaleString()} — Revision #${quote.revision}`, 'badge-ok', 'Accepted');
    } else {
      updateCard('quote-id', 'quote-detail', 'quote-badge', quote.id,
        `$${quote.amount.toLocaleString()} — First submission`, 'badge-ok', 'Accepted');
    }

    setPhase(2, 'done');
    await sleep();

    // ===================== PHASE 3 =====================
    setPhase(3, 'active');
    logger('─── PHASE 3: Purchase Order & Fulfillment ───', 'section');
    await sleep();

    let po = this.buyerAgent.preparePurchaseOrder(quote, logger);
    activateCard('card-po');
    updateCard('po-id', 'po-detail', 'po-badge', po.id, `$${po.totalAmount.toLocaleString()} — ${itemDescription}`, 'badge-info', 'Draft');
    await sleep();

    po = this.buyerAgent.sendPurchaseOrder(po, logger);
    await sleep();

    po = this.seller.reviewPurchaseOrder(po, logger);
    updateCard('po-id', 'po-detail', 'po-badge', po.id, `$${po.totalAmount.toLocaleString()} — Accepted`, 'badge-ok', 'Accepted');
    await sleep();

    po = this.seller.fulfillOrder(po, logger);
    updateCard('po-id', 'po-detail', 'po-badge', po.id, `$${po.totalAmount.toLocaleString()} — Dispatched`, 'badge-ok', 'Fulfilled');

    setPhase(3, 'done');
    await sleep();

    // ===================== PHASE 4 =====================
    setPhase(4, 'active');
    logger('─── PHASE 4: Reception & Payment ───', 'section');
    await sleep();

    const deliveryNote = this.receiveAgent.receiveProduct(po, logger);
    activateCard('card-delivery');
    const now = deliveryNote.receivedAt.toLocaleString();
    updateCard('dn-id', 'dn-detail', 'dn-badge', po.id, `Received at ${now}`, 'badge-ok', 'Confirmed');
    await sleep();

    logger(`[${this.seller['name']}] Delivery confirmed. Preparing invoice...`, 'accent2');
    await sleep();

    let invoice = this.seller.prepareInvoice(po, logger);
    activateCard('card-invoice');
    updateCard('inv-id', 'inv-detail', 'inv-badge', invoice.id, `$${invoice.amount.toLocaleString()} — Issued`, 'badge-info', 'Invoiced');
    await sleep();

    invoice = this.seller.receivePayment(invoice, logger);
    updateCard('inv-id', 'inv-detail', 'inv-badge', invoice.id, `$${invoice.amount.toLocaleString()} — Paid`, 'badge-ok', 'Paid');

    setPhase(4, 'done');
    // Using sleep to ensure final step is visible before complete message
    await sleep();

    showResult(true, `Procurement cycle completed successfully. Invoice ${invoice.id} — $${invoice.amount.toLocaleString()} paid.`);

    onFinish();
  }
}
