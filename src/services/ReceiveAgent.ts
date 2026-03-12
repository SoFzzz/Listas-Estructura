import { type PurchaseOrder, type DeliveryNote, OrderStatus } from "../models/types";

export class ReceiveAgent {
  private name: string = "Receive Agent";

  receiveProduct(po: PurchaseOrder, logger: (msg: string, type?: string) => void): DeliveryNote {
    const note: DeliveryNote = {
      orderId: po.id,
      receivedBy: this.name,
      receivedAt: new Date(),
      confirmed: true,
    };
    po.status = OrderStatus.DELIVERED;
    logger(`[${this.name}] Product received for PO ${po.id}. Delivery note issued. ✓`, 'success');
    return note;
  }
}
