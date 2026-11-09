export function formatCents(cents: string | number | bigint): string {
  const value = BigInt(cents);
  const rupees = value / 100n;
  const paise = (value % 100n).toString().padStart(2, "0");

  return `₹${rupees}.${paise}`;
}
