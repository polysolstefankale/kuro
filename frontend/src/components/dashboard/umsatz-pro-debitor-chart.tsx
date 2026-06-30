"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Debitor } from "@/types/debitor";
import type { ExchangeRatesToChf } from "@/lib/exchange-rates";
import type {
  LineChartPoint,
  PieChartSlice,
  UmsatzDebitorChartItem,
} from "@/lib/dashboard/chart-data";
import {
  debitorenToChfChartData,
  toLineChartData,
  toPieChartData,
} from "@/lib/dashboard/chart-data";
import { formatUmsatz } from "@/lib/waehrung";
import { chartColor } from "@/lib/dashboard/chart-colors";

interface UmsatzProDebitorChartProps {
  debitoren: Debitor[];
  exchangeRates: ExchangeRatesToChf;
}

function DebitorTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: UmsatzDebitorChartItem }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{item.name}</p>
      <p className="text-xs text-slate-500">{item.debitorNummer}</p>
      <p className="mt-1 font-mono text-slate-700">
        {formatUmsatz(item.umsatzChf, "CHF")}
      </p>
      {item.converted && (
        <p className="text-xs text-slate-500">
          Original: {formatUmsatz(item.umsatzOriginal, item.waehrung)}
        </p>
      )}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PieChartSlice }>;
}) {
  if (!active || !payload?.length) return null;

  const { name, value } = payload[0];

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{name}</p>
      <p className="font-mono text-slate-700">{formatUmsatz(value, "CHF")}</p>
    </div>
  );
}

function LineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: LineChartPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-slate-500">Rang {item.rank}</p>
      <p className="font-medium text-slate-900">{item.name}</p>
      <p className="text-xs text-slate-500">{item.debitorNummer}</p>
      <p className="mt-1 font-mono text-slate-700">
        {formatUmsatz(item.umsatzChf, "CHF")}
      </p>
    </div>
  );
}

function chfAxisTick(value: number): string {
  return formatUmsatz(value, "CHF").replace("CHF", "").trim();
}

export function UmsatzProDebitorChart({
  debitoren,
  exchangeRates,
}: UmsatzProDebitorChartProps) {
  const router = useRouter();
  const { items, unconvertible } = debitorenToChfChartData(
    debitoren,
    exchangeRates,
  );

  function goToDebitor(debitorId: number) {
    router.push(`/debitoren?debitorId=${debitorId}`);
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        Keine aktiven Debitoren mit umrechenbarem Umsatz vorhanden.
      </p>
    );
  }

  const pieData = toPieChartData(items);
  const lineData = toLineChartData(items);
  const barHeight = Math.max(320, items.length * 36);
  const convertedCount = items.filter((i) => i.converted).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="mb-1 text-sm font-medium text-slate-700">
            Balkendiagramm
          </h3>
          <p className="mb-3 text-xs text-slate-400">Klick öffnet den Debitor</p>
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart
              data={items}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e2e8f0"
              />
              <XAxis
                type="number"
                tickFormatter={chfAxisTick}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11, fill: "#334155" }}
              />
              <Tooltip content={<DebitorTooltip />} />
              <Bar
                dataKey="umsatzChf"
                radius={[0, 4, 4, 0]}
                barSize={18}
                className="cursor-pointer"
                onClick={(data) => {
                  const item = data?.payload as UmsatzDebitorChartItem | undefined;
                  if (item?.id) goToDebitor(item.id);
                }}
              >
                {items.map((_, index) => (
                  <Cell key={index} fill={chartColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-1 text-sm font-medium text-slate-700">
            Kuchendiagramm
          </h3>
          <p className="mb-3 text-xs text-slate-400">Klick öffnet den Debitor</p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={88}
                paddingAngle={4}
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer"
                onClick={(data) => {
                  const slice = data?.payload as PieChartSlice | undefined;
                  if (slice?.debitorId) goToDebitor(slice.debitorId);
                }}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={chartColor(index)} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-700">
          Liniendiagramm
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Umsatz in CHF nach Rang — Klick auf einen Punkt öffnet den Debitor
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={lineData}
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="rank"
              tick={{ fontSize: 12, fill: "#64748b" }}
              label={{
                value: "Rang",
                position: "insideBottom",
                offset: -4,
                fontSize: 11,
                fill: "#94a3b8",
              }}
            />
            <YAxis
              tickFormatter={chfAxisTick}
              tick={{ fontSize: 12, fill: "#64748b" }}
              width={72}
            />
            <Tooltip content={<LineTooltip />} />
            <Line
              type="monotone"
              dataKey="umsatzChf"
              stroke="#2563eb"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, index } = props;
                if (cx == null || cy == null || index == null) return null;
                const point = lineData[index];
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={chartColor(index)}
                    stroke="#fff"
                    strokeWidth={2}
                    className="cursor-pointer"
                    onClick={() => goToDebitor(point.id)}
                  />
                );
              }}
              activeDot={(props) => {
                const { cx, cy, index } = props;
                if (cx == null || cy == null || index == null) return null;
                const point = lineData[index];
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={7}
                    fill={chartColor(index)}
                    stroke="#fff"
                    strokeWidth={2}
                    className="cursor-pointer"
                    onClick={() => goToDebitor(point.id)}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {convertedCount > 0 && (
        <p className="text-xs text-slate-500">
          {convertedCount} Debitor{convertedCount === 1 ? "" : "en"} aus
          Fremdwährung zum Tageskurs in CHF umgerechnet.
        </p>
      )}

      {unconvertible.length > 0 && (
        <p className="text-xs text-amber-700">
          Nicht umrechenbar (Kurs fehlt): {unconvertible.join(", ")}
        </p>
      )}
    </div>
  );
}
