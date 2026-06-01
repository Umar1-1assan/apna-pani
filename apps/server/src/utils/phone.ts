export const PK_PHONE_REGEX = /^(?:\+92|0)3[0-9]{2}[0-9]{7}$/;

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("92") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+92${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("3")) {
    return `+92${digits}`;
  }

  return `+92${digits.replace(/^0+/, "")}`;
}
