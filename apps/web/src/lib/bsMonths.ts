/** BS (Bikram Sambat) calendar months, Baishakh (01) through Chaitra (12). */
export const BS_MONTHS = [
  { value: "01", label: "Baishakh" },
  { value: "02", label: "Jestha" },
  { value: "03", label: "Ashadh" },
  { value: "04", label: "Shrawan" },
  { value: "05", label: "Bhadra" },
  { value: "06", label: "Ashwin" },
  { value: "07", label: "Kartik" },
  { value: "08", label: "Mangsir" },
  { value: "09", label: "Poush" },
  { value: "10", label: "Magh" },
  { value: "11", label: "Falgun" },
  { value: "12", label: "Chaitra" },
] as const;

/** The "MM" segment of a "YYYY-MM-DD" BS date string, or null if malformed. */
export function bsDateMonth(date: string): string | null {
  const parts = date.split("-");
  return parts.length === 3 ? parts[1] : null;
}
