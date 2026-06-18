"use client";

import { useEffect, useState } from "react";

type Lead = {
  _id: string;
  sessionId: string;
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
  consultationBooked: boolean;
  lastMessage: string | null;
  updatedAt: string;
};

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      setError("Не удалось загрузить лиды.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Лиды — Senim Consulting</h1>
        <div className="flex gap-3 text-sm">
          <button onClick={load} className="text-blue-600 underline">
            Обновить
          </button>
          <a href="/" className="text-blue-600 underline">
            В чат
          </a>
        </div>
      </div>

      {!loading && !error && leads.length > 0 && (
        <div className="mb-4 flex gap-3 text-sm">
          <span className="rounded bg-white px-3 py-1 shadow-sm">
            Всего лидов: <b>{leads.length}</b>
          </span>
          <span className="rounded bg-white px-3 py-1 shadow-sm">
            Записаны на консультацию:{" "}
            <b>{leads.filter((l) => l.consultationBooked).length}</b>
          </span>
        </div>
      )}

      {loading && <p>Загрузка…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && leads.length === 0 && (
        <p className="text-gray-500">
          Пока нет клиентов, записавшихся на консультацию.
        </p>
      )}

      {!loading && leads.length > 0 && (
        <div className="overflow-x-auto rounded border border-gray-300 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Имя</th>
                <th className="px-3 py-2">Город</th>
                <th className="px-3 py-2">Телефон</th>
                <th className="px-3 py-2">Возраст</th>
                <th className="px-3 py-2">ИП/ТОО</th>
                <th className="px-3 py-2">Кред. история</th>
                <th className="px-3 py-2">Цель</th>
                <th className="px-3 py-2">Сумма</th>
                <th className="px-3 py-2">Бизнес</th>
                <th className="px-3 py-2">Залог</th>
                <th className="px-3 py-2">Формат</th>
                <th className="px-3 py-2">Время</th>
                <th className="px-3 py-2">Записан</th>
                <th className="px-3 py-2">Обновлён</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l._id} className="border-t border-gray-200">
                  <td className="px-3 py-2">{l.name || "—"}</td>
                  <td className="px-3 py-2">{l.city || "—"}</td>
                  <td className="px-3 py-2">{l.phone || "—"}</td>
                  <td className="px-3 py-2">{l.age ?? "—"}</td>
                  <td className="px-3 py-2">{l.hasIpOrToo || "—"}</td>
                  <td className="px-3 py-2">{l.creditHistory || "—"}</td>
                  <td className="px-3 py-2">{l.financingPurpose || "—"}</td>
                  <td className="px-3 py-2">{l.financingAmount || "—"}</td>
                  <td className="px-3 py-2">{l.businessType || "—"}</td>
                  <td className="px-3 py-2">{l.collateral || "—"}</td>
                  <td className="px-3 py-2">{l.consultationFormat || "—"}</td>
                  <td className="px-3 py-2">{l.preferredConsultationTime || "—"}</td>
                  <td className="px-3 py-2">
                    {l.consultationBooked ? "✅" : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {new Date(l.updatedAt).toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
