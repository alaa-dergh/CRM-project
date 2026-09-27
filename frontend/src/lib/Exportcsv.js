// Escapes a value for CSV: wraps it in quotes if it contains a comma, quote or newline,
// and doubles any internal quotes — otherwise a value like "Dupont, Ali" would silently
// break into two columns.
function escapeCsvValue(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// headers: string[]  — column titles
// rows: (string|number)[][]  — one array per row, same length/order as headers
export function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  // Prefix with a BOM so Excel opens accented French characters (é, è, à...) correctly.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}