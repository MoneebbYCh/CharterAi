import type { MarketplaceTemplate } from '../types'
import {
  bullet,
  code,
  guide,
  h,
  numbered,
  p,
  quote,
  table,
} from '../blocks'

export const API_DOCS_TEMPLATE: MarketplaceTemplate = {
  id: 'mp-api-docs',
  name: 'API Documentation',
  category: 'Engineering',
  standard: 'Diátaxis',
  tagline: 'Diátaxis four modes wrapping an OpenAPI-shaped reference.',
  description:
    'Good API documentation covers four different needs: teaching a first integration, solving a specific problem, listing every endpoint, and explaining why the API works the way it does. Diátaxis is a documentation framework built around that split, and many modern developer docs sites follow it. Combined with an OpenAPI generated reference that stays current with your actual API, this template pairs accurate reference material with the context developers need to get unstuck.',
  curated: true,
  icon: 'api',
  suggestedDocName: 'API Documentation',
  keywords: ['api', 'openapi', 'swagger', 'diataxis', 'docs'],
  build: () => [
    h(1, 'API Documentation'),
    quote(
      'OpenAPI / Swagger — Link or embed the generated OpenAPI reference under Reference. Keep tutorials, how-tos, and explanations hand-written so the spec is not a bare dump.',
    ),
    h(2, 'Tutorials — learning-oriented'),
    guide(
      'A tutorial teaches by doing. Goal: a new consumer completes one meaningful path end-to-end. Not a task cheat-sheet (that’s How-to) and not an exhaustive catalog (that’s Reference).',
    ),
    p('Goal: authenticate and create your first order in the sandbox.'),
    numbered('Create a sandbox API key in the developer portal'),
    numbered('Export it: export API_KEY=sk_test_…'),
    numbered('Create an order (see code below) and confirm you receive 201 with an id'),
    code(
      'bash',
      `curl -s -X POST https://api.example.com/v1/orders \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"sku":"sku_123","quantity":1}'`,
    ),
    h(2, 'How-to guides — task-oriented'),
    guide(
      'How-tos assume the reader already knows the product. Each guide answers “How do I…?” with steps — no narrative learning arc.',
    ),
    h(3, 'How to paginate list endpoints'),
    numbered('Pass ?limit=50 (max 100)'),
    numbered('Follow next_cursor from the response until null'),
    h(3, 'How to retry safely'),
    numbered('Send Idempotency-Key on POST/PUT'),
    numbered('Retry on 409 / 429 / 5xx with exponential backoff'),
    h(2, 'Reference — information-oriented'),
    guide(
      'Reference is for looking things up. Prefer generated OpenAPI for schemas; keep a short human index of the most-used endpoints here.',
    ),
    p('Auth: Bearer token. Versioning: /v1 prefix. Errors: { "error": { "code", "message", "request_id" } }.'),
    table(
      ['Method', 'Path', 'Description', 'Response'],
      [
        ['GET', '/v1/orders', 'List orders for the caller', '200 order[] + cursor'],
        ['POST', '/v1/orders', 'Create an order', '201 order'],
        ['GET', '/v1/orders/{id}', 'Fetch one order', '200 order | 404'],
        ['POST', '/v1/orders/{id}/cancel', 'Cancel if not fulfilled', '200 order | 409'],
      ],
    ),
    h(2, 'Explanation — understanding-oriented'),
    guide(
      'Explanation clarifies why the API is shaped this way — trade-offs, consistency model, migration notes. Not steps, not an endpoint dump.',
    ),
    p(
      'Orders are the aggregate root because fulfillment and payment both need a single id merchants can quote. Webhook deliveries are separate resources so retries do not mutate order history.',
    ),
    h(2, 'Open questions'),
    bullet('Should cancel be DELETE /orders/{id} or a dedicated action resource?'),
    bullet('Do we expose raw provider decline codes or a normalized enum?'),
  ],
}
