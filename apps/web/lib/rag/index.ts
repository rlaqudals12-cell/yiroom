// lib/rag 공개 API (클라이언트 안전 surface)
// 프롬프트/Gemini 호출부(askProductQuestion)는 server-only인 ./product-qa에 있으며,
// 서버 코드(예: app/api/products/qa)에서 직접 import한다. 브라우저 번들 노출을 막기 위해
// 여기(barrel)에서는 클라이언트 안전한 항목만 재노출한다.
export { FAQ_TEMPLATES, askProductQuestionClient } from './product-qa-shared';
export type { ProductQARequest, ProductQAResponse } from './product-qa-shared';
