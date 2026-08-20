import { z } from "zod";

export const shipmentEventSchema = z.object({
  type: z.enum(["picked_up", "in_transit", "delivery_attempted", "delivered", "exception"]),
  occurredAt: z.string().datetime(),
  location: z.string().min(1),
  note: z.string().max(500).optional(),
});

export const proofOfDeliverySchema = z.object({
  objectKey: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const shipmentRequestSchema = z.object({
  shipmentId: z.string().min(1),
  events: z.array(shipmentEventSchema).min(1),
  proofOfDelivery: z.array(proofOfDeliverySchema).default([]),
});

export const modelAdviceSchema = z.object({
  summary: z.string().min(1),
  exceptionCategory: z.enum(["none", "address", "damage", "delay", "recipient_unavailable", "other"]),
  requiresHumanReview: z.boolean(),
});

export type ShipmentRequest = z.infer<typeof shipmentRequestSchema>;
export type ModelAdvice = z.infer<typeof modelAdviceSchema>;

export type ShipmentDecision = {
  shipmentId: string;
  state: "delivered" | "manual_review" | "exception_opened";
  reason: string;
  evidenceCount: number;
};
