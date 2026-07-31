"use client";
/* Anneau de progression (score, préparation). */
export default function Ring({ pct, big = false, dark = false }) {
  const r = big ? 32 : 23;
  const size = big ? 74 : 56;
  const w = big ? 4 : 4.5;
  const c = 2 * Math.PI * r;
  return (
    <span className={"ring" + (big ? " big" : "") + (dark ? " on-dark-ring" : "")} role="img" aria-label={pct + " %"}>
      <svg width={size} height={size}>
        <circle className="bg" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={w} />
        <circle className="fg" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={w}
          strokeLinecap="round" strokeDasharray={c.toFixed(1)} strokeDashoffset={(c * (1 - pct / 100)).toFixed(1)} />
      </svg>
      <span>{pct}%</span>
    </span>
  );
}
