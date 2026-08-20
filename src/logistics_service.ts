import { createServer } from "node:http";
import { ZodError } from "zod";
import { createInfraiAdvisor } from "./shipment_advisor.js";
import { decideShipment } from "./shipment_decision.js";
import { shipmentRequestSchema } from "./shipment_models.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const advisor = createInfraiAdvisor(apiKey);
const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.method !== "POST" || request.url !== "/shipment-decisions") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const shipment = shipmentRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const advice = await advisor.advise(shipment);
    response.writeHead(200).end(JSON.stringify(decideShipment(shipment, advice)));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid shipment request" }));
      return;
    }
    console.error("shipment_decision_failed", { error });
    response.writeHead(502).end(JSON.stringify({ error: "Shipment advice could not be produced" }));
  }
});

server.listen(port, () => console.log(`shipment decision service listening on :${port}`));
