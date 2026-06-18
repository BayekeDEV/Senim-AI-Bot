import { getOpenAI, OPENAI_MODEL } from "./openai";

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
  consultationBooked: boolean | null;
}

const EXTRACTION_INSTRUCTIONS = `
Ты — модуль извлечения данных о клиенте из диалога компании "Senim Consulting".
Тебе дают всю историю переписки между клиентом (user) и ассистентом (assistant).
Верни СТРОГО JSON-объект со следующими полями. Если данных нет — ставь null.

Поля:
- "name": имя клиента (строка) или null.
- "city": город клиента (строка) или null.
- "phone": номер телефона (строка, как написал клиент) или null.
- "age": возраст числом или null.
- "hasIpOrToo": "ИП", "ТОО" или "нет" если клиент явно сказал; иначе null.
- "creditHistory": краткое описание кредитной истории словами клиента (например "хорошая", "есть просрочки", "был кредит") или null.
- "financingPurpose": цель финансирования (например "развитие бизнеса", "открытие кафе", "покупка оборудования", "личные цели") или null.
- "financingAmount": примерная сумма финансирования как написал клиент (например "10 млн", "5 миллионов тенге") или null.
- "businessType": вид бизнеса или деятельности (например "кафе", "магазин", "не применимо — личные цели") или null.
- "commercialProperty": информация о коммерческой недвижимости клиента или null.
- "collateral": информация о залоговом имуществе (например "квартира", "авто", "нет залога") или null.
- "requestedService": какая услуга интересует клиента или null.
- "consultationFormat": "office" если клиент из Астаны; "video" если из другого города; null если город неизвестен.
- "preferredConsultationTime": удобный день и время для консультации, если клиент указал (например "пятница 15:00", "завтра утром") или null.
- "consultationBooked": true ТОЛЬКО если клиент ЯВНО согласился на консультацию — "да", "согласен", "запишите", "давайте", "приду", "келісемін" и т.п. Если консультацию только предложили, но клиент не ответил согласием — false. Если клиент ещё думает — false.

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

    return {
      name: parsed.name ?? null,
      city: parsed.city ?? null,
      phone: parsed.phone ?? null,
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
      consultationBooked:
        typeof parsed.consultationBooked === "boolean"
          ? parsed.consultationBooked
          : false,
    };
  } catch (err) {
    console.error("Lead extraction failed:", err);
    return null;
  }
}
