# Engineering Standard: Native Node and Integration Design

**Status:** PROPOSED_STANDARD. Node implementation claims must be verified against the installed node definition for the target version.

## Node selection decision sequence

1. Discover whether the service has an official, installed n8n node with the required resource/operation.
2. Inspect the node's `type`, supported `version`, input/output connections, `properties`, credential requirements and field display conditions.
3. Prefer native operations when they clearly express the business action.
4. If an operation is missing, evaluate the HTTP Request node with an existing credential type and an explicit API contract.
5. Use Code nodes for genuinely complex transformation/validation that would be harder or less reliable through a long chain of generic nodes.
6. Build custom nodes only when there is a stable repeated capability that justifies maintenance and versioning.

## Required per-integration knowledge

- Node package and installed version (core vs community).
- Supported resources, operations and operation-specific parameter schema.
- Required and optional fields, valid defaults and conditional display rules.
- Supported authentication modes and least-privilege scopes.
- Input item assumptions and output item shape.
- Pagination, rate limits, external request timing and webhook constraints.
- Error categories, retryability, partial-failure behavior and deduplication.
- Expression and paired-item considerations.
- Tested JSON examples with target n8n version and fixture results.

## Source observations

In n8n `2.47.7`, `INodeTypeDescription` carries `version`, `defaults`, `inputs`, `outputs`, `properties` and optional `credentials`, among other fields. `INode` contains `type`, `typeVersion`, `parameters`, and optional retry and error-routing flags. Source: [`interfaces.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/interfaces.ts).

Therefore, **avoid inferring a node's valid parameters from a visually similar workflow** or using the newest version by default without checking compatibility.

## Item provenance and expressions

When programmatically transforming multiple items, verify whether `pairedItem` must be carried forward for downstream expressions. n8n's [node-building documentation](https://docs.n8n.io/data/data-mapping/data-item-linking/item-linking-node-building/) explicitly highlights this for programmatic nodes. Test both one-item and many-item inputs.

## Prohibited shortcuts

- Inventing a node type, operation or property because it 'looks reasonable'.
- Hardcoding credentials or client-specific tokens in a generated node.
- Using `continue` simply to hide unknown failures.
- Omitting rate-limit/pagination handling for large external datasets.
- Replacing five clear native operations with a hundred-line opaque script unless a documented reason and code tests justify it.
