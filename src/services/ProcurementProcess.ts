import { ShippingOffice } from "./ShippingOffice";
import { Supervisor } from "./Supervisor";
import { BuyerAgent } from "./BuyerAgent";
import { Seller } from "./Seller";
import { ReceiveAgent } from "./ReceiveAgent";
import { RFQStatus, QuoteStatus } from "../models/types";
import { LinkedList } from "../models/LinkedList";

export interface ProcessCallbacks {
  logger: (msg: string, type?: string) => void;
  setPhase: (num: number, state: string) => void;
  activateCard: (cardId: string) => void;
  updateCard: (idEl: string, detailEl: string, badgeEl: string, id: string, detail: string, badgeClass: string, badgeText: string) => void;
  showResult: (success: boolean, text: string) => void;
  onFinish: () => void;
  renderList: (list: LinkedList<any>) => void;
}

export class ProcurementProcess {
  private shippingOffice: ShippingOffice;
  private supervisor: Supervisor;
  private buyerAgent: BuyerAgent;
  private seller: Seller;
  private receiveAgent: ReceiveAgent;
  private cb: ProcessCallbacks;
  public documentList: LinkedList<any>;

  constructor(sellerName: string, callbacks: ProcessCallbacks) {
    this.shippingOffice = new ShippingOffice();
    this.supervisor = new Supervisor();
    this.buyerAgent = new BuyerAgent();
    this.seller = new Seller(sellerName);
    this.receiveAgent = new ReceiveAgent();
    this.cb = callbacks;
    this.documentList = new LinkedList<any>();
  }

  async run(itemDescription: string, requiresReview: boolean, initialQuoteAmount: number, supervisorRejects: boolean): Promise<void> {
    const { logger, setPhase, activateCard, updateCard, showResult, onFinish, renderList } = this.cb;

    // ===================== PHASE 1 =====================
    setPhase(1, 'active');
    logger('─── PHASE 1: Requisition & RFQ ───', 'section');

    const requisition = this.shippingOffice.generateRequisition(itemDescription, logger);
    this.appendDocument("REQUISITION", requisition);
    
    activateCard('card-req');
    updateCard('req-id', 'req-detail', 'req-badge', requisition.id, itemDescription, 'badge-ok', 'Issued');

    const rfq = this.buyerAgent.createRFQ(requisition, requiresReview, logger);
    this.appendDocument("RFQ", rfq);
    activateCard('card-rfq');

    if (requiresReview) {
      logger(`[Buyer Agent] Routing RFQ to Supervisor for review...`, 'accent3');
      
      const reviewedRfq = this.supervisor.reviewRFQ(rfq, logger, supervisorRejects);

      if (reviewedRfq.status === RFQStatus.REJECTED) {
        updateCard('rfq-id', 'rfq-detail', 'rfq-badge', rfq.id, `Rejected by Supervisor`, 'badge-fail', 'Rejected');
        setPhase(1, 'failed');
        showResult(false, 'RFQ rejected by Supervisor. Process must restart from the beginning.');
        renderList(this.documentList);
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

    // ===================== PHASE 2 =====================
    setPhase(2, 'active');
    logger('─── PHASE 2: Quote Negotiation ───', 'section');

    const willParticipate = this.seller.evaluateRFQ(rfq, logger);
    if (!willParticipate) {
      renderList(this.documentList);
      onFinish();
      return;
    }

    let quote = this.seller.prepareQuote(rfq, initialQuoteAmount, logger);
    this.appendDocument("QUOTE", quote);
    activateCard('card-quote');

    quote = this.buyerAgent.reviewQuote(quote, logger);

    if (quote.status === QuoteStatus.REJECTED_WITH_COMMENTS) {
      updateCard('quote-id', 'quote-detail', 'quote-badge', quote.id,
        `$${initialQuoteAmount.toLocaleString()} — Over budget`, 'badge-fail', 'Rejected');

      quote = this.seller.analyzeQuoteResponse(quote, logger);
      this.appendDocument("REVISED_QUOTE", quote);
      
      quote = this.buyerAgent.reviewRevisedQuote(quote, logger);
      updateCard('quote-id', 'quote-detail', 'quote-badge', quote.id,
        `$${quote.amount.toLocaleString()} — Revision #${quote.revision}`, 'badge-ok', 'Accepted');
    } else {
      updateCard('quote-id', 'quote-detail', 'quote-badge', quote.id,
        `$${quote.amount.toLocaleString()} — First submission`, 'badge-ok', 'Accepted');
    }

    setPhase(2, 'done');

    // ===================== PHASE 3 =====================
    setPhase(3, 'active');
    logger('─── PHASE 3: Purchase Order & Fulfillment ───', 'section');

    let po = this.buyerAgent.preparePurchaseOrder(quote, logger);
    this.appendDocument("PURCHASE_ORDER", po);
    activateCard('card-po');
    updateCard('po-id', 'po-detail', 'po-badge', po.id, `$${po.totalAmount.toLocaleString()} — ${itemDescription}`, 'badge-info', 'Draft');

    po = this.buyerAgent.sendPurchaseOrder(po, logger);

    po = this.seller.reviewPurchaseOrder(po, logger);
    updateCard('po-id', 'po-detail', 'po-badge', po.id, `$${po.totalAmount.toLocaleString()} — Accepted`, 'badge-ok', 'Accepted');

    po = this.seller.fulfillOrder(po, logger);
    updateCard('po-id', 'po-detail', 'po-badge', po.id, `$${po.totalAmount.toLocaleString()} — Dispatched`, 'badge-ok', 'Fulfilled');

    setPhase(3, 'done');

    // ===================== PHASE 4 =====================
    setPhase(4, 'active');
    logger('─── PHASE 4: Reception & Payment ───', 'section');

    const deliveryNote = this.receiveAgent.receiveProduct(po, logger);
    this.appendDocument("DELIVERY_NOTE", deliveryNote);
    activateCard('card-delivery');
    const now = deliveryNote.receivedAt.toLocaleString();
    updateCard('dn-id', 'dn-detail', 'dn-badge', po.id, `Received at ${now}`, 'badge-ok', 'Confirmed');

    logger(`[${this.seller['name']}] Delivery confirmed. Preparing invoice...`, 'accent2');

    let invoice = this.seller.prepareInvoice(po, logger);
    this.appendDocument("INVOICE", invoice);
    activateCard('card-invoice');
    updateCard('inv-id', 'inv-detail', 'inv-badge', invoice.id, `$${invoice.amount.toLocaleString()} — Issued`, 'badge-info', 'Invoiced');

    invoice = this.seller.receivePayment(invoice, logger);
    updateCard('inv-id', 'inv-detail', 'inv-badge', invoice.id, `$${invoice.amount.toLocaleString()} — Paid`, 'badge-ok', 'Paid');

    setPhase(4, 'done');

    showResult(true, `Procurement cycle completed successfully. Invoice ${invoice.id} — $${invoice.amount.toLocaleString()} paid.`);

    renderList(this.documentList);
    onFinish();
  }

  private appendDocument(type: string, data: any) {
    this.documentList.append({ type, data });
  }
}
