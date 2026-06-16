/**
 * Client-side CSV export — no dependencies. Builds an RFC-4180-ish CSV from an
 * array of flat objects and triggers a browser download. The leading BOM keeps
 * Excel happy with UTF-8.
 */
export type CsvRow = Record<string, string | number | boolean | null | undefined>;

function escapeCsv(value: CsvRow[string]): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ];
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, rows: CsvRow[]): boolean {
  if (typeof window === "undefined" || rows.length === 0) return false;
  const csv = toCsv(rows);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
