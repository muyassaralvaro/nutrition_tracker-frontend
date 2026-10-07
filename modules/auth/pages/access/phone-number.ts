// ponytail: Generic trunk-zero cleanup; use phone metadata when country-specific rules are needed.
export function normalizeNationalPhone(value: string, callingCode: string): string {
  const raw = value.trimStart();
  const allDigits = raw.replace(/\D/g, "");
  const digits = raw.startsWith("00") ? allDigits.slice(2) : allDigits;
  const code = callingCode.replace(/\D/g, "");
  const national = (raw.startsWith("+") || raw.startsWith("00")) && code && digits.startsWith(code)
    ? digits.slice(code.length)
    : digits;
  return national.replace(/^0+/, "");
}
