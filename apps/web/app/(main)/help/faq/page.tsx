/**
 * FAQ 페이지
 * @description Launch - DB 연동 (Mock → Supabase)
 */

import { getPublishedFAQs } from '@/lib/api/announcements';
import { FAQClient } from './FAQClient';

export default async function FAQPage() {
  const faqs = await getPublishedFAQs();

  return <FAQClient faqs={faqs} />;
}
