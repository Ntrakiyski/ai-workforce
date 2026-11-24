# Engineering Standard: Errors, Retries and Recovery

**Status:** PROPOSED_STANDARD with selected facts verified from tagged code and official docs. The exact ordering and runtime behavior of retry/continue paths requires fault-injection tests.

## Separate three different classes of failure

| Class | Examples | Default handling |
|---|---|---|
| Transient technical | 429 throttling, temporary 503, network timeout | Bounded retry/backoff if safe to repeat |
| Permanent technical | 401 unauthorized, invalid parameter, removed endpoint | Stop with actionable diagnosis; alert owner |
| Business/partial | Duplicate invoice, missing client approval, partial multi-step mutation | Explicit branch or compensation, often human review |

For each external side-effect node, record: retryable errors, maximum attempts, delay/backoff policy, idempotency key or dedupe mechanism, compensation strategy, user-facing failure status and alert destination.

## Native fields and behavior

The tagged `INode` type contains `retryOnFail`, `maxTries`, `waitBetweenTries`, `continueOnFail`, and `onError`; `OnError` is `'continueErrorOutput' | 'continueRegularOutput' | 'stopWorkflow'`.

Source: [`interfaces.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/interfaces.ts).

Do **not** claim all retry/continue combinations are safe or supported for a given node without runtime verification.

## Continue-on-error rule

Continuing is acceptable when a failed item can be quarantined, skipped by policy or routed to a dedicated error branch that maintains explicit failure status.

**MUST NOT:** silently treat a failed charge, email send, database update or external API mutation as success. **MUST:** preserve original item identity, error reason, operation, attempt count, correlation ID and resolution state.

## Retry rule

- Retry only errors classified as potentially transient.
- Use bounded attempts and backoff; where supported, honor upstream `Retry-After`.
- Do not blindly retry non-idempotent side effects. Require a downstream idempotency key, dedupe ledger or safe reconciliation.
- Add timeout and escalation after exhausted retries.
- Test response ordering and duplicate delivery, not only success.

## Error workflow

Official n8n documentation states an error workflow runs when a configured workflow execution fails, begins with the Error Trigger, and can be reused. Trigger-time errors can have a different payload from execution-time failures; fields such as execution ID/URL may be unavailable.

Source: [Handle errors gracefully](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully.md).

**Minimum error record (our contract):** workflow identifier, environment, node/operation when available, correlation ID, failure class, exception summary, redacted original input reference, run URL if saved, retryable flag, severity, and escalation destination.

## Recovery strategies

1. **Fail-fast:** Stop on corruption, invalid credentials, unsafe authorization failure.
2. **Retry:** Bounded transient retry for operations that are safe to repeat.
3. **Continue with error item:** Item-level independent processing; accumulate failures and summarize.
4. **Dead-letter/quarantine:** Persist failed input safely for manual or scheduled replay.
5. **Compensation:** Restore previous state or trigger compensating action when a sequence partially applied.
6. **Human escalation:** High-risk failure, missing required data or ambiguous external state.

## Required staging scenarios

- 429 with `Retry-After`, transient 503 and timeout.
- Invalid credentials and invalid input (must not retry endlessly).
- Success response lost after external side effect (retry duplication risk).
- One item fails in a batch, others succeed.
- Error Trigger execution vs trigger activation error.
- Failure after a successful prior mutation; assess compensation.
- Restart/retry and duplicate webhook delivery.

## Still to verify

Runtime semantics for each `onError` mode, `continueOnFail` backward compatibility, retry configuration limits, and error workflow behavior on node-specific cases must be tested against the pinned n8n instance before formal enforcement.
