import type { Requisition } from "../models/types";

export class ShippingOffice {
  private name: string = "Shipping Office";

  generateRequisition(description: string, logger: (msg: string, type?: string) => void): Requisition {
    const requisition: Requisition = {
      id: `REQ-${Date.now()}`,
      description,
      requestedBy: this.name,
      createdAt: new Date(),
    };
    logger(`[${this.name}] Requisition generated: ${requisition.id} — "${description}"`, 'accent');
    return requisition;
  }
}
