import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { loadCompanyInfo } from "@/lib/companyInfo";
import { buildQualificationContext } from "@/lib/qualification";
import { extractLeadData, ExtractedLead } from "@/lib/extraction";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId: string = body.sessionId;
    const messages: ChatMessage[] = body.messages;

    if (!sessionId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "sessionId and messages are required" },
        { status: 400 }
      );
    }

    const companyKnowledge = await loadCompanyInfo();

    // 1. Extract current state BEFORE generating a reply so the assistant
    //    knows which fields are collected and which stage the dialog is in.
    const currentState = await extractLeadData(messages);
    const qualificationContext = buildQualificationContext(currentState);
    const systemPrompt = buildSystemPrompt(
      companyKnowledge,
      qualificationContext
    );

    // 2. Generate the assistant reply with full stage awareness.
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Извините, произошла ошибка. Попробуйте ещё раз.";

    const fullConversation: ChatMessage[] = [
      ...messages,
      { role: "assistant", content: reply },
    ];

    // 3. Re-extract from the full conversation (includes the new reply).
    const extracted = await extractLeadData(fullConversation);

    // 4. Save to MongoDB ONLY when the client explicitly agreed to consultation.
    if (extracted?.consultationBooked === true) {
      await connectToDatabase();
      const lastUserMessage =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? null;

      const update: Record<string, unknown> = {
        lastMessage: lastUserMessage,
        consultationBooked: true,
      };

      mergeNonNull(update, extracted);

      await Lead.findOneAndUpdate(
        { sessionId },
        { $set: update, $setOnInsert: { sessionId } },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function mergeNonNull(target: Record<string, unknown>, source: ExtractedLead) {
  const keys: (keyof ExtractedLead)[] = [
    "name",
    "city",
    "phone",
    "age",
    "hasIpOrToo",
    "creditHistory",
    "financingPurpose",
    "financingAmount",
    "businessType",
    "commercialProperty",
    "collateral",
    "requestedService",
    "consultationFormat",
    "preferredConsultationTime",
  ];

  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== "") {
      target[key] = value;
    }
  }

  if (source.consultationBooked === true) {
    target.consultationBooked = true;
  }
}
