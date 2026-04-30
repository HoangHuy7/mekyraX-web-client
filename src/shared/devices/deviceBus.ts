/**
 * Device Bus - Pluggable hardware integration layer.
 *
 * Components register handlers (e.g. ESC/POS receipt printer, USB barcode
 * scanner) and emit events. This keeps the UI free from device specifics
 * while still letting OrderWorkspacePage / OrderDetailPage trigger printing,
 * subscribe to scans, and so on.
 *
 * Default implementation is a no-op — the build still works without any
 * physical device. Concrete drivers (WebUSB, WebSerial, system print dialog)
 * can `register*Handler` at startup.
 */

export interface PrintReceiptPayload {
  orderId: string;
  pdfBase64?: string;
  copies?: number;
}

export type PrintReceiptHandler = (payload: PrintReceiptPayload) => Promise<void> | void;
export type ScanHandler = (code: string) => void;
export type ScanUnsubscribe = () => void;

const noopPrint: PrintReceiptHandler = (payload) => {
  // eslint-disable-next-line no-console
  console.info('[deviceBus] print receipt (no driver registered)', payload);
};

let printHandler: PrintReceiptHandler = noopPrint;
const scanHandlers = new Set<ScanHandler>();

export const deviceBus = {
  registerPrintReceiptHandler(handler: PrintReceiptHandler): void {
    printHandler = handler;
  },
  resetPrintReceiptHandler(): void {
    printHandler = noopPrint;
  },
  async printReceipt(payload: PrintReceiptPayload): Promise<void> {
    await printHandler(payload);
  },
  onScan(handler: ScanHandler): ScanUnsubscribe {
    scanHandlers.add(handler);
    return () => scanHandlers.delete(handler);
  },
  emitScan(code: string): void {
    scanHandlers.forEach((h) => {
      try {
        h(code);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[deviceBus] scan handler error', err);
      }
    });
  },
};
