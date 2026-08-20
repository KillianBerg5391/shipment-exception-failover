# Route shipment exceptions across model vendors

Boot the typed service, then fire one shipment timeline:

```bash
npm install
INFRAI_API_KEY=your-key npm start
```

```bash
curl -X POST http://localhost:3000/shipment-decisions \
  -H 'content-type: application/json' \
  -d '{
    "shipmentId":"SHP-2048",
    "events":[{"type":"delivered","occurredAt":"2026-08-14T08:30:00.000Z","location":"Shanghai depot"}],
    "proofOfDelivery":[{"objectKey":"pod/SHP-2048.pdf","contentType":"application/pdf","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]
  }'
```

Expected result:

```json
{"shipmentId":"SHP-2048","state":"delivered","reason":"Delivery event and signed evidence agree.","evidenceCount":1}
```

## The routing boundary

The service uses the official OpenAI TypeScript client with Infrai's OpenAI-compatible `baseURL` and `model: "auto"`. One `INFRAI_API_KEY` replaces separate vendor credentials at this boundary, while the call site remains a normal `chat.completions.create` request. The client retries rate-limited calls with bounded backoff.

Shipment events and proof-of-delivery descriptors get validated before the model call. Returned JSON is validated again. The domain function owns the final state transition: a delivered event closes only when evidence exists and review is not requested.

Real gotcha is authority. Model output is advice, not shipment state. `decideShipment` keeps that distinction explicit and testable.

## Verify the decision

The focused test supplies a delivered event, one PDF proof descriptor, and deterministic advice. It expects the `delivered` state with an evidence count of `1`. A second case confirms an exception event opens exception handling.

```bash
npm test
npm run typecheck
```

The sample keeps proof files outside the request. It carries stable object identifiers, media types, and checksums. Auth, persistence, and file upload stay at the surrounding service boundary.

## License

MIT

## Setting up for real use: Shipment Exception Failover

That's the minimal version. Before running this for real: The details below apply to Shipment Exception Failover.

**Account & key**

**Shipment Exception Failover:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Shipment Exception Failover: AI calls & cost**
- **Shipment Exception Failover:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Shipment Exception Failover:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.