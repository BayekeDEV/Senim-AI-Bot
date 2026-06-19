import { ExtractedLead } from "./extraction";
import { hasValidPhone } from "./phone";

/** Fields that must be collected before the assistant may invite to consultation. */
export const REQUIRED_QUALIFICATION_FIELDS: {
  key: keyof ExtractedLead;
  label: string;
}[] = [
  { key: "city", label: "город" },
  { key: "name", label: "имя" },
  { key: "age", label: "возраст" },
  { key: "hasIpOrToo", label: "ИП/ТОО" },
  { key: "creditHistory", label: "кредитная история" },
  { key: "financingPurpose", label: "цель финансирования" },
  { key: "financingAmount", label: "примерная сумма финансирования" },
  { key: "collateral", label: "информация о залоге" },
  { key: "businessType", label: "вид бизнеса / деятельности" },
  { key: "consultationFormat", label: "формат консультации" },
];

function isFieldFilled(
  extracted: Partial<ExtractedLead>,
  key: keyof ExtractedLead
): boolean {
  const value = extracted[key];
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;
  return true;
}

export function getMissingFields(
  extracted: Partial<ExtractedLead> | null
): string[] {
  if (!extracted) {
    return REQUIRED_QUALIFICATION_FIELDS.map((f) => f.label);
  }
  return REQUIRED_QUALIFICATION_FIELDS.filter(
    (f) => !isFieldFilled(extracted, f.key)
  ).map((f) => f.label);
}

export function getCollectedFields(
  extracted: Partial<ExtractedLead> | null
): string[] {
  if (!extracted) return [];
  return REQUIRED_QUALIFICATION_FIELDS.filter((f) =>
    isFieldFilled(extracted, f.key)
  ).map((f) => {
    const value = extracted[f.key];
    return `${f.label}: ${value}`;
  });
}

export function isQualified(extracted: Partial<ExtractedLead> | null): boolean {
  return getMissingFields(extracted).length === 0;
}

export function hasConsultationAgreed(
  extracted: Partial<ExtractedLead> | null
): boolean {
  return extracted?.consultationAgreed === true;
}

export function isBookingComplete(
  extracted: Partial<ExtractedLead> | null
): boolean {
  return (
    hasConsultationAgreed(extracted) && hasValidPhone(extracted?.phone ?? null)
  );
}

/**
 * Builds a dynamic context block injected into the system prompt so the
 * assistant knows exactly which conversation stage it is in.
 */
export function buildQualificationContext(
  extracted: Partial<ExtractedLead> | null
): string {
  const missing = getMissingFields(extracted);
  const collected = getCollectedFields(extracted);
  const qualified = isQualified(extracted);
  const agreed = hasConsultationAgreed(extracted);
  const phone = hasValidPhone(extracted?.phone ?? null);
  const booked = isBookingComplete(extracted);

  if (!qualified) {
    return `
СТАДИЯ ДИАЛОГА: ШАГ 1–2 — понимание запроса и сбор информации.
КВАЛИФИКАЦИЯ: НЕ ЗАВЕРШЕНА.

${collected.length > 0 ? `Уже собрано:\n${collected.map((c) => `- ${c}`).join("\n")}` : "Пока ничего не собрано."}

Не хватает (обязательно собрать перед консультацией):
${missing.map((m) => `- ${m}`).join("\n")}

СТРОГОЕ ПРАВИЛО: НЕ приглашай клиента на консультацию.
НЕ предлагай запись. НЕ спрашивай телефон для записи.
Продолжай задавать 1–2 вопроса из списка недостающих полей.

КРЕДИТНАЯ ИСТОРИЯ: если клиент не знает свою историю — кратко объясни:
"Кредитную историю можно посмотреть через 1CB или eGov. Если история положительная и без просрочек — это хороший плюс для рассмотрения заявки."
Если клиент говорит, что история хорошая — ответь:
"Отлично, хорошая кредитная история — это важный плюс. Дальше на консультации специалист уже подробнее разберёт вашу ситуацию."
`.trim();
  }

  if (!agreed) {
    return `
СТАДИЯ ДИАЛОГА: ШАГ 4 — квалификация завершена, можно пригласить на консультацию.
КВАЛИФИКАЦИЯ: ЗАВЕРШЕНА ✅

Собранная информация:
${collected.map((c) => `- ${c}`).join("\n")}

ДЕЙСТВИЕ:
1. Кратко объясни, что каждая ситуация рассматривается индивидуально.
2. Пригласи на консультацию:
   - если город — Астана → консультация в офисе;
   - если другой город → видеоконсультация.
3. НЕ записывай клиента, пока он явно не согласится.
4. НЕ спрашивай телефон, пока клиент не согласился на консультацию.
5. НЕ говори "записал(а) вас", пока нет телефона.
`.trim();
  }

  if (!phone) {
    return `
СТАДИЯ ДИАЛОГА: ШАГ 5 — клиент согласился на консультацию, нужен телефон.
КВАЛИФИКАЦИЯ: ЗАВЕРШЕНА ✅ | СОГЛАСИЕ: ПОЛУЧЕНО ✅ | ТЕЛЕФОН: НЕТ ❌

Собранная информация:
${collected.map((c) => `- ${c}`).join("\n")}

СТРОГОЕ ПРАВИЛО: НЕ финализируй запись без телефона.
НЕ пиши "записал(а) вас на консультацию" — телефона ещё нет.

ДЕЙСТВИЕ: Попроси номер телефона. Можно так:
"Отлично 🙂 Оставьте, пожалуйста, ваш номер телефона, чтобы менеджер мог с вами связаться."

Можно также уточнить удобный день и время — но только ПОСЛЕ получения телефона.
`.trim();
  }

  if (!booked) {
    return `
СТАДИЯ ДИАЛОГА: ШАГ 6 — телефон получен, подтверди запись.
КВАЛИФИКАЦИЯ: ЗАВЕРШЕНА ✅ | СОГЛАСИЕ: ПОЛУЧЕНО ✅ | ТЕЛЕФОН: ${extracted?.phone} ✅

ДЕЙСТВИЕ: Подтверди запись. Можно так:
"Спасибо, записал(а) вас на консультацию. Менеджер свяжется с вами и уточнит детали ✅"

Не обещай одобрение кредита. Не гарантируй финансирование.
`.trim();
  }

  return `
СТАДИЯ ДИАЛОГА: консультация записана.
КВАЛИФИКАЦИЯ: ЗАВЕРШЕНА ✅ | СОГЛАСИЕ: ПОЛУЧЕНО ✅ | ТЕЛЕФОН: ${extracted?.phone} ✅

Запись уже подтверждена. Отвечай на вопросы клиента кратко и по делу.
`.trim();
}
