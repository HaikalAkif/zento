/** First day of ECB reference rates. */
export const ECB_START = '1999-01-04';

/** YYYY-MM-DD for the same calendar day `years` ago, clamped to the ECB start. */
export function yearsAgo(years: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  const iso = d.toISOString().split('T')[0];
  return iso < ECB_START ? ECB_START : iso;
}

/** Whole years of ECB history available before today. */
export function maxYearsBack(from = new Date()): number {
  return (
    from.getUTCFullYear() -
    Number(ECB_START.slice(0, 4)) -
    (from.toISOString().slice(5, 10) < ECB_START.slice(5, 10) ? 1 : 0)
  );
}
