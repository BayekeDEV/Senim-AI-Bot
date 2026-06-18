import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILead extends Document {
  sessionId: string;
  name: string | null;
  city: string | null;
  phone: string | null;
  age: number | null;
  hasIpOrToo: string | null; // "ИП" | "ТОО" | "нет" | null
  creditHistory: string | null;
  financingPurpose: string | null;
  financingAmount: string | null;
  businessType: string | null;
  commercialProperty: string | null;
  collateral: string | null;
  requestedService: string | null;
  consultationFormat: string | null; // "office" | "video" | null
  preferredConsultationTime: string | null;
  consultationBooked: boolean;
  lastMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: null },
    city: { type: String, default: null },
    phone: { type: String, default: null },
    age: { type: Number, default: null },
    hasIpOrToo: { type: String, default: null },
    creditHistory: { type: String, default: null },
    financingPurpose: { type: String, default: null },
    financingAmount: { type: String, default: null },
    businessType: { type: String, default: null },
    commercialProperty: { type: String, default: null },
    collateral: { type: String, default: null },
    requestedService: { type: String, default: null },
    consultationFormat: { type: String, default: null },
    preferredConsultationTime: { type: String, default: null },
    consultationBooked: { type: Boolean, default: false },
    lastMessage: { type: String, default: null },
  },
  { timestamps: true }
);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
