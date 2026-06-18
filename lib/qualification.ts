import { ExtractedLead } from "./extraction";

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
  const agreed = extracted?.consultationBooked === true;
  const hasPreferredTime = isFieldFilled(
    extracted ?? {},
    "preferredConsultationTime"
  );

  if (!qualified) {
    return `
СТАДИЯ ДИАЛОГА: ШАГ 1–2 — понимание запроса и сбор информации.
КВАЛИФИКАЦИЯ: НЕ ЗАВЕРШЕНА.

${collected.length > 0 ? `Уже собрано:\n${collected.map((c) => `- ${c}`).join("\n")}` : "Пока ничего не собрано."}

Не хватает (обязательно собрать перед консультацией):
${missing.map((m) => `- ${m}`).join("\n")}

СТРОГОЕ ПРАВИЛО: НЕ приглашай клиента на консультацию.
НЕ предлагай запись. НЕ спрашивай удобное время.
Продолжай задавать 1–2 вопроса из списка недостающих полей.
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
4. НЕ спрашивай день и время, пока клиент не согласился на консультацию.
`.trim();
  }

  if (!hasPreferredTime) {
    return `
СТАДИЯ ДИАЛОГА: ШАГ 5 — клиент согласился на консультацию.
КВАЛИФИКАЦИЯ: ЗАВЕРШЕНА ✅ | СОГЛАСИЕ: ПОЛУЧЕНО ✅

Собранная информация:
${collected.map((c) => `- ${c}`).join("\n")}

ДЕЙСТВИЕ: Спроси удобный день и время для консультации.
Подтверди формат (${extracted?.consultationFormat === "office" ? "офис в Астане" : "видеозвонок"}).
`.trim();
  }

  return `
СТАДИЯ ДИАЛОГА: ШАГ 6 — консультация согласована.
КВАЛИФИКАЦИЯ: ЗАВЕРШЕНА ✅ | СОГЛАСИЕ: ПОЛУЧЕНО ✅ | ВРЕМЯ: УКАЗАНО ✅

Удобное время клиента: ${extracted?.preferredConsultationTime}
Подтверди запись и поблагодари клиента.
`.trim();
}
