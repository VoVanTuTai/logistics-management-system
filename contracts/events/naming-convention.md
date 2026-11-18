# Domain Event Naming & Schema Versioning Convention

## 1. Event Naming Rule
- Format: `<domain>.<past_tense_action>` (lowercase `snake_case`, dot-separated).
- Examples: `shipment.created`, `manifest.sealed`, `scan.inbound`, `delivery.delivered`, `ndr.created`.
- Exchange: `domain.events` (RabbitMQ topic exchange, durable).

## 2. Standard Envelope (Schema Version `1.0`)
Every domain event published via `outbox_events` MUST contain:

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `schema_version` | `string` (SemVer `MAJOR.MINOR`, default `"1.0"`) | Optional (defaults `"1.0"`) | Contract version for backward-compatibility validation |
| `event_id` | `string` (UUID v4) | Yes | Globally unique event identifier for deduplication |
| `event_type` | `string` | Yes | Canonical routing key matching `event-types.md` |
| `occurred_at` | `string` (ISO-8601 UTC) | Yes | Domain timestamp when the business milestone occurred |
| `shipment_code` | `string \| null` | Yes | Correlation key linking tracking & reporting projections |
| `actor` | `string \| null` | Yes | Operator / courier / system identity triggering the event |
| `location` | `string \| null` | Yes | Hub code or location code where the event occurred |
| `data` | `object` | Yes | Domain-specific payload documented in `contracts/events/payloads/*.json` |

## 3. Backward-Compatibility Rules
- **Minor bump (`1.0` → `1.1`)**: Adding new optional fields inside `data` only. Existing consumers MUST ignore unknown keys.
- **Major bump (`1.x` → `2.0`)**: Removing/renaming required fields or changing field types requires dual publishing or a new versioned routing key.
- Automated verification: run `node --test contracts/events/event-schema-compatibility.test.mjs`.
