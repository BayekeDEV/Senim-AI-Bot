import { getOpenAI, OPENAI_MODEL } from "./openai";
import { hasValidPhone, normalizePhone } from "./phone";

export interface ExtractedLead {
  name: string | null;
  city: string | null;
  phone: string | null;
  age: number | null;
  hasIpOrToo: string | null;
  creditHistory: string | null;
  financingPurpose: string | null;
  financingAmount: string | null;
  businessType: string | null;
  commercialProperty: string | null;
  collateral: string | null;
  requestedService: string | null;
  consultationFormat: string | null;
  preferredConsultationTime: string | null;
  /** Client explicitly agreed to consultation (may still lack phone). */
  consultationAgreed: boolean | null;
  /** True only when consultationAgreed AND valid phone are both present. */
  consultationBooked: boolean | null;
}

const EXTRACTION_INSTRUCTIONS = `
Ты — модуль извлечения данных о клиенте из диалога компании "Senim Consulting".
Тебе дают всю историю переписки между клиентом (user) и ассистентом (assistant).
Верни СТРОГО JSON-объект со следующими полями. Если данных нет — ставь null.

Поля:
- "name": имя клиента (строка) или null.
- "city": город клиента (строка) или null.
- "phone": номер телефона клиента (строка) или null. Распознавай форматы:
  87071234567, +77071234567, 8 707 123 45 67, +7 707 123 45 67 и похожие.
  Извлекай номер только если клиент явно его написал.
- "age": возраст числом или null.
- "hasIpOrToo": "ИП", "ТОО" или "нет" если клиент явно сказал; иначе null.
- "creditHistory": краткое описание кредитной истории словами клиента (например "хорошая", "не знаю", "есть просрочки") или null.
- "financingPurpose": цель финансирования или null.
- "financingAmount": примерная сумма финансирования или null.
- "businessType": вид бизнеса / деятельности или null.
- "commercialProperty": информация о коммерческой недвижимости или null.
- "collateral": информация о залоговом имуществе или null.
- "requestedService": какая услуга интересует клиента или null.
- "consultationFormat": "office" если клиент из Астаны; "video" если из другого города; иначе null.
- "preferredConsultationTime": удобный день и время, если клиент указал, или null.
- "consultationAgreed": true ТОЛЬКО если клиент ЯВНО согласился на консультацию — "да", "согласен", "запишите", "давайте", "приду", "келісемін" и т.п. Если только предложили, но клиент не согласился — false.
- "consultationBooked": всегда ставь false — это поле вычисляется автоматически на сервере.

Извлекай только то, что реально упомянуто в диалоге. Не выдумывай.
Отвечай только JSON, без пояснений.
`.trim();

export async function extractLeadData(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<ExtractedLead | null> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Клиент" : "Ассистент"}: ${m.content}`)
    .join("\n");

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_INSTRUCTIONS },
        { role: "user", content: `История диалога:\n${transcript}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ExtractedLead>;

    const phone = normalizePhone(parsed.phone ?? null);
    const consultationAgreed = parsed.consultationAgreed === true;
    const consultationBooked =
      consultationAgreed && hasValidPhone(phone);

    return {
      name: parsed.name ?? null,
      city: parsed.city ?? null,
      phone,
      age: typeof parsed.age === "number" ? parsed.age : null,
      hasIpOrToo: parsed.hasIpOrToo ?? null,
      creditHistory: parsed.creditHistory ?? null,
      financingPurpose: parsed.financingPurpose ?? null,
      financingAmount: parsed.financingAmount ?? null,
      businessType: parsed.businessType ?? null,
      commercialProperty: parsed.commercialProperty ?? null,
      collateral: parsed.collateral ?? null,
      requestedService: parsed.requestedService ?? null,
      consultationFormat: parsed.consultationFormat ?? null,
      preferredConsultationTime: parsed.preferredConsultationTime ?? null,
      consultationAgreed,
      consultationBooked,
    };
  } catch (err) {
    console.error("Lead extraction failed:", err);
    return null;
  }
}
