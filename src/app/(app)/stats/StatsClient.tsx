"use client";

import "./stats.css";

const CHART_COLORS = [
  "#1CC29F", "#5B8DEF", "#F15BB5", "#F4A259",
  "#9B5DE5", "#00BBF9", "#FF652F", "#43AA8B",
  "#E63946", "#457B9D",
];

interface CategoryItem {
  key: string;
  label: string;
  emoji: string;
  amount: number;
  percent: number;
}

interface GroupBalance {
  name: string;
  emoji: string;
  net: number;
}

interface TopSpender {
  id: string;
  name: string;
  amount: number;
  isMe: boolean;
}

function formatMoney(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}₹${formatted}`;
}

// ---- Donut Chart Component ----
function DonutChart({
  data,
  size = 200,
  stroke = 28,
  label,
  centerValue,
}: {
  data: { percent: number; color: string }[];
  size?: number;
  stroke?: number;
  label?: string;
  centerValue?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="donut-chart">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0F2F5"
          strokeWidth={stroke}
        />
        {/* Segments */}
        {data.map((seg, i) => {
          const segLength = (seg.percent / 100) * circumference;
          const offset = circumference - segLength;
          const rotation = (accumulated / 100) * 360;
          accumulated += seg.percent;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "50% 50%",
                opacity: 0,
                animation: `strokeDraw 0.8s ease-out ${i * 0.15}s forwards`,
              }}
            />
          );
        })}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "rotate(0deg)" }}>
        {centerValue && (
          <span className="counter-anim text-2xl font-black text-[#1E293B]">
            {centerValue}
          </span>
        )}
        {label && (
          <span className="text-xs font-semibold text-[#94A3B8]">{label}</span>
        )}
      </div>
    </div>
  );
}

// ---- Bar Chart Component ----
function HorizontalBar({
  label,
  value,
  maxValue,
  color,
  emoji,
  delay = 0,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  emoji?: string;
  delay?: number;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2E3942]">
          {emoji && <span>{emoji}</span>}
          {label}
        </span>
        <span className="text-sm font-bold text-[#64748B]">{formatMoney(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#F0F2F5]">
        <div
          className="bar-fill h-full rounded-full"
          style={{
            width: `${Math.max(pct, 2)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}CC)`,
            animationDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
}

// ---- Main Stats Client ----
export default function StatsClient({
  totalSpent,
  totalOwed,
  totalOwe,
  myTotalPaid,
  categoryData,
  myExpenseData,
  groupBalances,
  topSpenders,
  groupCount,
  expenseCount,
}: {
  totalSpent: number;
  totalOwed: number;
  totalOwe: number;
  myTotalPaid: number;
  categoryData: CategoryItem[];
  myExpenseData: CategoryItem[];
  groupBalances: GroupBalance[];
  topSpenders: TopSpender[];
  groupCount: number;
  expenseCount: number;
}) {
  const donutData = categoryData.map((c, i) => ({
    percent: c.percent,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const myDonutData = myExpenseData.map((c, i) => ({
    percent: c.percent,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const maxGroupBal = Math.max(...groupBalances.map((g) => Math.abs(g.net)), 1);
  const maxSpender = topSpenders.length > 0 ? topSpenders[0].amount : 1;

  // Simple hash function for avatar colors
  const colorFromId = (id: string) => {
    const palette = ["#1CC29F", "#FF652F", "#5B8DEF", "#9B5DE5", "#F15BB5", "#00BBF9", "#F4A259", "#43AA8B"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* ---- Header ---- */}
      <header className="stats-header relative overflow-hidden px-5 pb-20 pt-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative">
          <h1 className="text-2xl font-black">Analytics</h1>
          <p className="mt-0.5 text-sm text-white/85">Your expense insights at a glance</p>
        </div>

        {/* Summary pills */}
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <div className="stat-pill text-center">
            <p className="text-xl font-black">{groupCount}</p>
            <p className="text-[11px] font-semibold text-white/70">Groups</p>
          </div>
          <div className="stat-pill text-center">
            <p className="text-xl font-black">{expenseCount}</p>
            <p className="text-[11px] font-semibold text-white/70">Expenses</p>
          </div>
          <div className="stat-pill text-center">
            <p className="text-xl font-black">{formatMoney(totalSpent)}</p>
            <p className="text-[11px] font-semibold text-white/70">Total Spent</p>
          </div>
        </div>
      </header>

      <div className="-mt-8 space-y-4 px-4 pb-8">
        {/* ---- Owed vs Owe Card ---- */}
        <div className="stats-card stats-delay-1 overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
          <div className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[#1E293B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1CC29F" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Balance Overview
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">You are owed</p>
                <p className="counter-anim mt-1 text-2xl font-black text-emerald-600">{formatMoney(totalOwed)}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-red-500">You owe</p>
                <p className="counter-anim mt-1 text-2xl font-black text-red-500">{formatMoney(totalOwe)}</p>
              </div>
            </div>

            {/* Net */}
            <div className="mt-3 rounded-xl bg-[#F7F8FA] p-3 text-center">
              <p className="text-xs font-bold text-[#94A3B8]">NET BALANCE</p>
              <p className={`text-xl font-black ${(totalOwed - totalOwe) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {(totalOwed - totalOwe) >= 0 ? "+" : ""}{formatMoney(totalOwed - totalOwe)}
              </p>
            </div>
          </div>
        </div>

        {/* ---- All Expenses by Category (Donut) ---- */}
        <div className="stats-card stats-delay-2 overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
          <div className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[#1E293B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B8DEF" strokeWidth="2" strokeLinecap="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              All Expenses by Category
            </h2>

            {categoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#94A3B8]">No expenses yet — add some to see charts!</p>
            ) : (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <DonutChart
                  data={donutData}
                  centerValue={formatMoney(totalSpent)}
                  label="Total"
                />
                <div className="flex-1 space-y-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.key} className="flex items-center gap-2.5">
                      <span
                        className="legend-dot inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length], animationDelay: `${i * 0.3}s` }}
                      />
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="flex-1 text-sm font-semibold text-[#2E3942]">{cat.label}</span>
                      <span className="text-sm font-bold text-[#64748B]">{formatMoney(cat.amount)}</span>
                      <span className="w-10 text-right text-xs font-bold text-[#94A3B8]">{cat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- My Expenses Donut ---- */}
        <div className="stats-card stats-delay-3 overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
          <div className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[#1E293B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F15BB5" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Spending Breakdown
            </h2>

            {myExpenseData.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#94A3B8]">You haven&apos;t paid for any expenses yet.</p>
            ) : (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <DonutChart
                  data={myDonutData}
                  size={180}
                  stroke={24}
                  centerValue={formatMoney(myTotalPaid)}
                  label="You paid"
                />
                <div className="flex-1 space-y-2">
                  {myExpenseData.map((cat, i) => (
                    <div key={cat.key} className="flex items-center gap-2.5">
                      <span
                        className="legend-dot inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length], animationDelay: `${i * 0.3}s` }}
                      />
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="flex-1 text-sm font-semibold text-[#2E3942]">{cat.label}</span>
                      <span className="text-sm font-bold text-[#64748B]">{formatMoney(cat.amount)}</span>
                      <span className="w-10 text-right text-xs font-bold text-[#94A3B8]">{cat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Group Balance Bars ---- */}
        {groupBalances.length > 0 && (
          <div className="stats-card stats-delay-4 overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
            <div className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[#1E293B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4A259" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="18" rx="2"/><rect x="14" y="9" width="7" height="12" rx="2"/></svg>
                Group-wise Balance
              </h2>

              {groupBalances.map((g, i) => (
                <HorizontalBar
                  key={g.name}
                  label={g.name}
                  emoji={g.emoji}
                  value={Math.abs(g.net)}
                  maxValue={maxGroupBal}
                  color={g.net > 0 ? "#1CC29F" : "#FF652F"}
                  delay={i * 0.12}
                />
              ))}

              <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1CC29F]" /> You are owed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FF652F]" /> You owe
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ---- Top Spenders Leaderboard ---- */}
        {topSpenders.length > 0 && (
          <div className="stats-card stats-delay-4 overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
            <div className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[#1E293B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B5DE5" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                Top Spenders
              </h2>

              <div className="space-y-4">
                {topSpenders.map((user, i) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-white"
                        style={{ backgroundColor: colorFromId(user.id) }}
                      >
                        {getInitials(user.name)}
                      </div>
                      {i === 0 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] shadow-sm">
                          👑
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
                        {user.isMe ? "You" : user.name}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F2F5]">
                        <div
                          className="bar-fill h-full rounded-full bg-[#9B5DE5]"
                          style={{
                            width: `${(user.amount / maxSpender) * 100}%`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#64748B]">{formatMoney(user.amount)}</p>
                      <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Paid</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
