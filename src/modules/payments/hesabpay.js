export function afnMinorForUsd(amount, afnPerUsd) {
  const n = Number(amount),
    r = Number(afnPerUsd);
  if (
    !Number.isFinite(n) ||
    !Number.isFinite(r) ||
    n <= 0 ||
    r <= 0 ||
    n > 1e9 ||
    r > 10000
  )
    return NaN;
  const cents = Math.round(n * 100),
    rate = Math.round(r * 1e6);
  return Number((BigInt(cents) * BigInt(rate) + 500000n) / 1000000n);
}
