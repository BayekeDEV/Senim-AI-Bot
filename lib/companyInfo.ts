import { promises as fs } from "fs";
import path from "path";

/**
 * Built-in fallback knowledge. Used only if company-info.md cannot be read
 * (missing, empty or unreadable). Keep it in sync with the key facts so the
 * assistant never loses its grounding.
 */
export const FALLBACK_COMPANY_INFO = `
# Senim Consulting — базовые знания (резервные)

Senim Consulting — консалтинговая компания. Помогаем с финансированием бизнеса,
недвижимостью и сопутствующими услугами. Мы не банк и сами кредиты не выдаём:
анализируем ситуацию, подбираем решение и сопровождаем клиента. Главный офис — Астана.

Услуги:
- Финансирование бизнеса
- Программа DAMU (ставка от 12,6%)
- Ипотечный отдел
- Коммерческая недвижимость
- Оценка недвижимости
- Легализация

Форматы консультации:
- Астана → консультация в офисе
- Другие города → видеоконсультация

Принципы:
- Каждая ситуация рассматривается индивидуально.
- Соблюдаем конфиденциальность.
- Не гарантируем одобрение и не принимаем решения за банк.
`.trim();

const isProduction = process.env.NODE_ENV === "production";

let cached: string | null = null;

/**
 * Loads the company knowledge base from company-info.md at the project root.
 * Falls back to the built-in knowledge if the file is missing or empty.
 *
 * In development the file is re-read on every call so edits take effect without
 * a restart. In production the result is cached for performance.
 */
export async function loadCompanyInfo(): Promise<string> {
  if (isProduction && cached) {
    return cached;
  }

  try {
    const filePath = path.join(process.cwd(), "company-info.md");
    const content = await fs.readFile(filePath, "utf-8");
    const trimmed = content.trim();

    if (trimmed.length > 0) {
      cached = trimmed;
      return trimmed;
    }

    console.warn(
      "[companyInfo] company-info.md is empty — using built-in fallback knowledge."
    );
  } catch {
    console.warn(
      "[companyInfo] company-info.md not found or unreadable — using built-in fallback knowledge."
    );
  }

  cached = FALLBACK_COMPANY_INFO;
  return FALLBACK_COMPANY_INFO;
}
