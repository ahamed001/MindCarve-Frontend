import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader, StatCard, StatGroup, ChartCard, Card } from '../../../components/Layout';
import { AsyncContent, EmptyState } from '../../../components/Feedback';
import { ActivityList } from '../../../components/ActivityTimeline';
import { fetchOverview } from '../../../redux/thunks/adminThunks';

const RISK_COLORS = { low: '#FDBA74', moderate: '#F97316', high: '#9A3412', unclassified: '#CBD5E1', awaiting_configuration: '#E2E8F0' };

const weekDelta = ({ completedThisWeek, completedLastWeek }) => {
  if (!completedLastWeek) return completedThisWeek ? { text: 'first completions', tone: 'brand' } : null;
  const pct = Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);
  return { text: `${pct >= 0 ? '+' : ''}${pct}%`, tone: pct >= 0 ? 'brand' : 'red' };
};

const AssessmentsByDayChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 0);
  if (!max) return <EmptyState title="No completed assessments" message="Completed assessments from the last 7 days will appear here." />;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EEF2F6" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 13 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#FFF4EE' }} formatter={(v) => [v, 'Completed']} labelFormatter={(l, p) => p?.[0]?.payload?.date || l} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((d) => (
              <Cell key={d.date} fill={d.count === max ? '#E8571F' : '#CBD5E1'} />
            ))}
            <LabelList dataKey="count" position="top" style={{ fill: '#1E293B', fontSize: 13, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RiskDonut = ({ risk }) => {
  const segments = risk.segments.filter((s) => ['low', 'moderate', 'high'].includes(s.key) || s.count > 0);
  const total = risk.total;
  if (!total) return <EmptyState title="No results yet" message="Risk levels appear once scored assessments are submitted." />;
  return (
    <>
      <div className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={segments.filter((s) => s.count)} dataKey="count" nameKey="label" innerRadius={62} outerRadius={84} paddingAngle={1.5} stroke="none" startAngle={90} endAngle={-270}>
              {segments.filter((s) => s.count).map((s) => (
                <Cell key={s.key} fill={RISK_COLORS[s.key]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{total}</span>
          <span className="text-sm text-muted">results</span>
        </div>
      </div>
      <ul className="mt-5 divide-y divide-line border-t border-line">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLORS[s.key] }} />
            <span className="flex-1 text-ink-soft">{s.label}</span>
            <span className="w-12 text-right font-semibold text-ink">{s.count}</span>
            <span className="w-12 text-right text-muted">{total ? Math.round((s.count / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{risk.note}</p>
    </>
  );
};

const OverviewPage = () => {
  const dispatch = useDispatch();
  const overview = useSelector((s) => s.dashboard.overview);
  const load = () => dispatch(fetchOverview());
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="Overview" subtitle="Today at Athma Counselling" />
      <AsyncContent resource={overview} onRetry={load} loadingLabel="Loading dashboard…">
        {({ kpis, assessmentsByDay, riskDistribution, latestActivity }) => {
          const delta = weekDelta(kpis);
          return (
            <div className="space-y-6">
              <StatGroup>
                <StatCard label="Assessments completed this week" value={kpis.completedThisWeek.toLocaleString()} hintHighlight={delta?.text} hintTone={delta?.tone} hint={delta ? 'vs last week' : 'No completions last week'} />
                <StatCard label="Registered patients" value={kpis.registeredPatients.toLocaleString()} hintHighlight={`+${kpis.newPatients30d}`} hint="in the last 30 days" />
                <StatCard label="High-risk follow-ups" value={kpis.highRiskFollowUps.toLocaleString()} hintHighlight={kpis.highRiskFollowUps ? `${kpis.highRiskFollowUps} awaiting` : 'None'} hintTone={kpis.highRiskFollowUps ? 'red' : 'green'} hint="clinical review" />
              </StatGroup>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <ChartCard title="Assessments by day" meta="Last 7 days">
                  <AssessmentsByDayChart data={assessmentsByDay} />
                </ChartCard>
                <ChartCard title="Risk levels" meta={`Last ${riskDistribution.rangeDays} days`}>
                  <RiskDonut risk={riskDistribution} />
                </ChartCard>
              </div>

              <Card
                title="Latest activity"
                bodyClassName=""
                action={
                  <Link to="/admin/activity" className="btn-outline px-3.5 py-1.5">
                    View all
                  </Link>
                }
              >
                {latestActivity.length ? <ActivityList items={latestActivity} /> : <EmptyState title="No activity yet" />}
              </Card>
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
};

export default OverviewPage;
