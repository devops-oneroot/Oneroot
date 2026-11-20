"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Lead } from "@/lib/types";
import {
  CHART_COLORS,
  getLeadsByCountry,
  getLeadsByIndustry,
  getLeadsByProduct,
  getLeadsByResponsible,
  getLeadsByStatus,
  getPipelineSummary,
} from "@/lib/analytics";

interface AnalyticsDashboardProps {
  leads: Lead[];
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#f8f9fa] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 lg:p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      )}
      {empty ? (
        <p className="mt-8 py-12 text-center text-sm text-slate-400">
          No data yet — add leads to see charts.
        </p>
      ) : (
        <div className="mt-4 h-56 sm:h-72">{children}</div>
      )}
    </div>
  );
}

function formatChartName(name: string): string {
  if (name === "Not specified" || name === "Not assigned") return name;
  return name.replace(/_/g, " ");
}

function PieBlock({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="mx-auto aspect-square h-40 shrink-0 sm:h-full sm:max-h-56 sm:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="88%"
              label={false}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const count = Number(value ?? 0);
                const pct = total ? ((count / total) * 100).toFixed(0) : "0";
                return [`${count} (${pct}%)`, formatChartName(String(item.payload?.name ?? ""))];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs sm:max-h-56">
        {data.map((item, i) => {
          const pct = total ? ((item.value / total) * 100).toFixed(0) : "0";
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <li
              key={item.name}
              className="flex items-start gap-2 leading-snug text-slate-700"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 break-words">
                {formatChartName(item.name)}
              </span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {item.value} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AnalyticsDashboard({ leads }: AnalyticsDashboardProps) {
  const summary = getPipelineSummary(leads);
  const byCountry = getLeadsByCountry(leads);
  const byProduct = getLeadsByProduct(leads);
  const byStatus = getLeadsByStatus(leads);
  const byIndustry = getLeadsByIndustry(leads);
  const byResponsible = getLeadsByResponsible(leads);

  const isEmpty = leads.length === 0;

  return (
    <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={summary.total} accent="#7c3aed" />
        <StatCard label="In pipeline" value={summary.inPipeline} accent="#0ea5e9" />
        <StatCard label="Closed won" value={summary.deals} accent="#22c55e" />
        <StatCard
          label="Export / Domestic"
          value={summary.export}
          accent="#f59e0b"
        />
      </div>
      <p className="text-xs text-slate-500 -mt-2 pl-1">
        Export: {summary.export} · Domestic: {summary.domestic}
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Leads by country" empty={isEmpty}>
          {!isEmpty && <PieBlock data={byCountry} />}
        </ChartCard>

        <ChartCard title="Leads by product" empty={isEmpty}>
          {!isEmpty && <PieBlock data={byProduct} />}
        </ChartCard>

        <ChartCard title="Pipeline status" empty={isEmpty}>
          {!isEmpty && <PieBlock data={byStatus} />}
        </ChartCard>

        <ChartCard title="Industry split" empty={isEmpty}>
          {!isEmpty && <PieBlock data={byIndustry} />}
        </ChartCard>
      </div>

      <ChartCard
        title="Leads by responsible person"
        subtitle="Team workload overview"
        empty={isEmpty}
      >
        {!isEmpty && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byResponsible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]}>
                {byResponsible.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
