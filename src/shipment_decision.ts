import type { ModelAdvice, ShipmentDecision, ShipmentRequest } from "./shipment_models.js";

export function decideShipment(shipment: ShipmentRequest, advice: ModelAdvice): ShipmentDecision {
  const latest = [...shipment.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const evidenceCount = shipment.proofOfDelivery.length;

  if (latest.type === "delivered" && evidenceCount > 0 && !advice.requiresHumanReview) {
    return { shipmentId: shipment.shipmentId, state: "delivered", reason: advice.summary, evidenceCount };
  }

  if (advice.requiresHumanReview || (latest.type === "delivered" && evidenceCount === 0)) {
    return { shipmentId: shipment.shipmentId, state: "manual_review", reason: advice.summary, evidenceCount };
  }

  return { shipmentId: shipment.shipmentId, state: "exception_opened", reason: advice.summary, evidenceCount };
}
