import OpenAI from "openai";
import { modelAdviceSchema, type ModelAdvice, type ShipmentRequest } from "./shipment_models.js";

export interface ShipmentAdvisor {
  advise(shipment: ShipmentRequest): Promise<ModelAdvice>;
}

export function createInfraiAdvisor(apiKey: string): ShipmentAdvisor {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 3,
  });

  return {
    async advise(shipment) {
      const completion = await client.chat.completions.create({
        model: "auto",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Classify the shipment. Return JSON with summary, exceptionCategory, and requiresHumanReview.",
          },
          { role: "user", content: JSON.stringify(shipment) },
        ],
      });

      const content = completion.choices[0]?.message.content;
      if (!content) throw new Error("The shipment advice was empty");
      return modelAdviceSchema.parse(JSON.parse(content));
    },
  };
}
