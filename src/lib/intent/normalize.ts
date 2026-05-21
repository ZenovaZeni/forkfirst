export function isLikelyReceiptScannerTypo(text: string): boolean {
  const normalized = text.toLowerCase().replace(/-/g, " ");
  const hasRecipeScanner =
    /\brecipes?\s+(?:scanner|scanning|scan|parser|capture)\b/.test(normalized) ||
    /\bscan(?:s|ning)?\s+recipes?\b/.test(normalized);
  if (!hasRecipeScanner) return false;

  const hasExpenseContext = /\b(expenses?|expense tracking|spend(?:ing)?|budget(?:ing)?|merchant|reimbursements?|tax|deductible)\b/.test(normalized);
  const hasDocumentContext = /\b(csv|spreadsheet|ocr|receipts?)\b/.test(normalized);
  const hasFoodContext = /\b(meal|meal plan|cook(?:ing|book)?|ingredients?|grocery|shopping list|pantry|nutrition)\b/.test(normalized);

  return hasExpenseContext || (hasDocumentContext && !hasFoodContext);
}

export function normalizeLikelyReceiptScannerTypo(text: string): string {
  if (!isLikelyReceiptScannerTypo(text)) return text;
  return text
    .replace(/\brecipes?\s+(scanner|scanning|scan|parser|capture)\b/gi, "receipt $1")
    .replace(/\bscan(?:s|ning)?\s+recipes?\b/gi, "scan receipts");
}
