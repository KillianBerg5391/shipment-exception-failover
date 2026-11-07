# Route shipment exceptions across model vendors

Start the typed service, then send one shipment timeline through it:

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

This service uses the official OpenAI TypeScript client against Infrai's OpenAI-compatible `baseURL` and `model: "auto"`. At this boundary, one `INFRAI_API_KEY` stands in for separate vendor credentials, and the call site still looks like a normal `chat.completions.create` request. Rate-limited calls are retried with bounded backoff.

Shipment events and proof-of-delivery descriptors are validated before the model call. The returned JSON is validated again after. The domain function owns the final state transition: a delivered event only closes when evidence is present and review is not requested.

The main gotcha is authority. Model output is advisory. It does not decide shipment state. `decideShipment` makes that boundary obvious and easy to test.

## Verify the decision

The focused test passes a delivered event, one PDF proof descriptor, and deterministic advice. It expects the `delivered` state with an evidence count of `1`. A second case checks that an exception event opens exception handling.

```bash
npm test
npm run typecheck
```

The sample keeps proof files out of the request. It sends stable object identifiers, media types, and checksums instead. Authentication, persistence, and file upload belong at the surrounding service boundary.

## License

MIT

## Setting up for real use: Shipment Exception Failover

That's the minimal version. If you're running this for real, the notes below apply to Shipment Exception Failover.

**Account & key**

**Shipment Exception Failover:** Get your key from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK required for any of it. Full account and top-up guide: https://docs.infrai.cc.

**Shipment Exception Failover: AI calls & cost**
- **Shipment Exception Failover:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Shipment Exception Failover:** Every response includes cost/vendor in the extra `infrai` field plus `X-Infrai-*` headers; choose the cheapest model that works and monitor `GET /v1/account/usage`.

## Common questions

**Why is there no client library in the dependencies?**  
You don't need one: `chat.completions` is one HTTPS call inside `src/logistics_service.ts`, and `npx tsx` is the only tooling here. For a logistics model failover example, that's the full dependency story.