import { type RFQ, RFQStatus } from "../models/types";

export class Supervisor {
  private name: string = "Supervisor";

  reviewRFQ(rfq: RFQ, logger: (msg: string, type?: string) => void, forceReject: boolean = false): RFQ {
    logger(`[${this.name}] Reviewing RFQ: ${rfq.id}`, 'warn');

    // Simulate approval logic: approve based on forceReject flag or keyword
    const approved = !forceReject && !rfq.details.toLowerCase().includes("blocked");

    if (approved) {
      rfq.status = RFQStatus.APPROVED;
      rfq.supervisorComments = "Approved after review.";
      logger(`[${this.name}] RFQ ${rfq.id} APPROVED. Forwarding to seller.`, 'success');
    } else {
      rfq.status = RFQStatus.REJECTED;
      rfq.supervisorComments = "Rejected: requirements unclear, process restarted.";
      logger(`[${this.name}] RFQ ${rfq.id} REJECTED — requirements unclear.`, 'error');
    }

    return rfq;
  }
}
