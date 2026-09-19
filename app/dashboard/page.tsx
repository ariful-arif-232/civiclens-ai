import Link from 'next/link';
import {
  ArrowUpRight,
  Activity,
  Files,
  TriangleAlert,
  Clock3,
  CheckCircle2,
  ScanLine,
} from 'lucide-react';
import { currentReports, aggregateDashboard } from '@/lib/reports-service';
import { PageHeading, CategoryIcon, RiskBadge, Badge, EmptyState } from '@/components/ui';
import { label } from '@/lib/types';
export const metadata = { title: 'Risk intelligence' };
export default async function Dashboard() {
  const data = aggregateDashboard(await currentReports());
  const kpis = [
    {
      label: 'Total reports',
      value: data.totalReports,
      icon: Files,
      note: 'All community reports',
    },
    {
      label: 'Critical issues',
      value: data.criticalIssues,
      icon: TriangleAlert,
      note: 'Open · priority 80–100',
      urgent: true,
    },
    {
      label: 'High risk issues',
      value: data.highRiskIssues,
      icon: Activity,
      note: 'Open · priority 60–79',
    },
    { label: 'Open issues', value: data.openReports, icon: Clock3, note: 'Awaiting resolution' },
    {
      label: 'Resolved issues',
      value: data.resolvedIssues,
      icon: CheckCircle2,
      note: 'Action completed',
    },
  ];
  return (
    <div className="container page">
      <PageHeading
        eyebrow="THE BIGGER PICTURE"
        title="Risk intelligence"
        description="Know what needs attention. Understand why. Take the next step."
      >
        <Link href="/admin" className="button">
          Authority workspace <ArrowUpRight size={17} />
        </Link>
      </PageHeading>
      <div className="dashboard-kpis">
        {kpis.map((k) => (
          <div className={`kpi ${k.urgent ? 'urgent' : ''}`} key={k.label}>
            <div className="kpi-label">
              <span>{k.label}</span>
              <k.icon size={15} />
            </div>
            <strong>{k.value.toString().padStart(2, '0')}</strong>
            <small>{k.note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-main">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your next priorities</h2>
              <p>Unresolved issues, ranked by current risk score</p>
            </div>
            <Link href="/issues">
              Explore all <ArrowUpRight size={13} />
            </Link>
          </div>
          {data.topPriorityIssues.length ? (
            <div className="priority-list">
              {data.topPriorityIssues.map((r, i) => (
                <Link className="priority-row" href={`/issues/${r.id}`} key={r.id}>
                  <span className="priority-number">0{i + 1}</span>
                  <span className="icon-box">
                    <CategoryIcon category={r.category} size={19} />
                  </span>
                  <div className="priority-copy">
                    <h3>{r.title}</h3>
                    <p>
                      {r.area} · {label(r.category)}
                    </p>
                  </div>
                  <RiskBadge report={r} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing in the queue"
              description="All clear. New reports will appear here."
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Where attention is needed</h2>
              <p>Areas ranked by highest open-issue score</p>
            </div>
          </div>
          {data.topRiskAreas.map((area) => (
            <Link
              className="area-row"
              style={{ display: 'block' }}
              href={`/issues?area=${encodeURIComponent(area.area)}`}
              key={area.area}
            >
              <div className="area-top">
                <strong>{area.area}</strong>
                <span>
                  {area.risk}
                  <small className="subtle"> / 100</small>
                </span>
              </div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${area.risk >= 80 ? 'hot' : ''}`}
                  style={{ width: `${area.risk}%` }}
                />
              </div>
              <p>
                {area.reports} open reports · {area.urgent} high or critical
              </p>
            </Link>
          ))}
          {!data.topRiskAreas.length && <p>No open reports to compare.</p>}
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>What’s being reported</h2>
              <p>All reports by category</p>
            </div>
          </div>
          {data.categoryBreakdown.map((c) => (
            <div key={c.name} className="breakdown-row">
              <span>{label(c.name)}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(c.value / Math.max(1, data.totalReports)) * 100}%` }}
                />
              </div>
              <b>{c.value}</b>
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Severity at a glance</h2>
              <p>Assessment severity, separate from priority</p>
            </div>
          </div>
          {['critical', 'high', 'medium', 'low'].map((s) => (
            <div className="severity-row" key={s}>
              <Badge value={s} />
              <span>{data.severityBreakdown.find((c) => c.name === s)?.value || 0}</span>
            </div>
          ))}
        </section>
        <section className="panel explain-panel">
          <span className="icon-box">
            <ScanLine size={23} />
          </span>
          <h3>
            AI understands.
            <br />
            Our engine prioritizes.
          </h3>
          <p>
            AI interprets photos and descriptions. Our transparent rules calculate the final score,
            so every priority has an explanation.
          </p>
          <div className="formula">
            Severity <b>50</b> + Frequency <b>30</b> + Recency <b>20</b>
            <br />
            <strong>100 possible points. Zero hidden weighting.</strong>
          </div>
        </section>
      </div>
      <section className="panel recent-list">
        <div className="panel-heading">
          <div>
            <h2>Recent high-risk reports</h2>
            <p>Latest unresolved reports with scores of 60 or higher</p>
          </div>
          <span className="subtle">
            Updated{' '}
            {new Date(data.generatedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Dhaka',
            })}{' '}
            BD time
          </span>
        </div>
        {data.recentReports.map((r) => (
          <Link href={`/issues/${r.id}`} key={r.id} className="recent-row">
            <div>
              <h3>{r.title}</h3>
              <p>
                {r.area} · {new Date(r.created_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'Asia/Dhaka',
                })}
              </p>
            </div>
            <Badge value={r.status} />
            <RiskBadge report={r} />
          </Link>
        ))}
        {!data.recentReports.length && <p>No high-risk reports right now.</p>}
      </section>
    </div>
  );
}
