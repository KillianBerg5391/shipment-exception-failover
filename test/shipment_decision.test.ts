import assert from "node:assert/strict";
import test from "node:test";
import { decideShipment } from "../src/shipment_decision.js";
import { shipmentRequestSchema } from "../src/shipment_models.js";

test("closes a delivered shipment only when proof is present", () => {
  const shipment = shipmentRequestSchema.parse({
    shipmentId: "SHP-2048",
    events: [{ type: "delivered", occurredAt: "2026-08-14T08:30:00.000Z", location: "Shanghai depot" }],
    proofOfDelivery: [{
      objectKey: "pod/SHP-2048.pdf",
      contentType: "application/pdf",
      sha256: "a".repeat(64),
    }],
  });

  const decision = decideShipment(shipment, {
    summary: "Delivery event and signed evidence agree.",
    exceptionCategory: "none",
    requiresHumanReview: false,
  });

  assert.deepEqual(decision, {
    shipmentId: "SHP-2048",
    state: "delivered",
    reason: "Delivery event and signed evidence agree.",
    evidenceCount: 1,
  });
});

test("routes an exception event to an open exception", () => {
  const shipment = shipmentRequestSchema.parse({
    shipmentId: "SHP-4096",
    events: [{ type: "exception", occurredAt: "2026-08-14T09:00:00.000Z", location: "Suzhou hub" }],
  });

  const decision = decideShipment(shipment, {
    summary: "Address needs correction before another attempt.",
    exceptionCategory: "address",
    requiresHumanReview: false,
  });

  assert.equal(decision.state, "exception_opened");
});
