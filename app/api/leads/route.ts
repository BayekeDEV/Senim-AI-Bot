import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const leads = await Lead.find({
      consultationBooked: true,
      phone: { $exists: true, $nin: [null, ""] },
    })
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("Leads route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
