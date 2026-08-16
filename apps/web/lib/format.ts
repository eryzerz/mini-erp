export const formatIDR = (value: string | number): string => {
  const number = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Format an Indonesian phone number as the user types: any non-digit input
 * is stripped, a leading "0" becomes "+62", and the national number is
 * grouped — mobile (8xx) as "812 3456 7890", landline as "21 555 0134".
 * Already-formatted values round-trip to the same shape.
 */
export const formatPhone = (input: string): string => {
  let digits = input.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";
  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (!digits.startsWith("62")) {
    digits = `62${digits}`;
  }
  const national = digits.slice(2);
  if (!national) return "+62";

  const mobile = national.startsWith("8");
  const grouped = mobile
    ? national.replace(/^(\d{3})(\d{1,4})?(\d{1,4})?/, (_, a: string, b?: string, c?: string) =>
        [a, b, c].filter(Boolean).join(" "),
      )
    : national.length >= 9
      ? national.replace(/^(\d{2})(\d{1,3})?(\d{1,4})?/, (_, a: string, b?: string, c?: string) =>
          [a, b, c].filter(Boolean).join(" "),
        )
      : national.replace(/^(\d{3})(\d{1,3})?/, (_, a: string, b?: string) => [a, b].filter(Boolean).join(" "));

  return `+62 ${grouped}`;
};

/**
 * Format an Indonesian NPWP as the user types: 15 digits laid out as
 * XX.XXX.XXX.X-XXX.XXX. Deterministic, so already-formatted values
 * round-trip unchanged.
 */
export const formatTaxId = (input: string): string => {
  const digits = input.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";

  const groups = [2, 3, 3, 1, 3, 3];
  let out = "";
  let used = 0;
  for (const size of groups) {
    if (used >= digits.length) break;
    const part = digits.slice(used, used + size);
    out += part;
    used += part.length;
    if (used < digits.length) {
      out += used === 9 ? "-" : ".";
    }
  }
  return out;
};
