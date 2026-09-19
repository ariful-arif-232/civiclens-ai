import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, ScanLine } from 'lucide-react';
import { currentReports, withImages } from '@/lib/reports-service';
import { uuidInput } from '@/lib/validation';
import { Badge, CategoryIcon } from '@/components/ui';
import { label, statuses } from '@/lib/types';
export const metadata = { title: 'Issue details' };
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidInput.safeParse(id).success) notFound();
  const found = (await currentReports()).find((r) => r.id === id);
  if (!found) notFound();
  const r = (await withImages([found]))[0];
  return (
    <div className="container page">
      <Link className="back-link" href="/issues">
        <ArrowLeft size={14} />
        All community issues
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {label(r.category).toUpperCase()} · {r.is_demo ? 'DEMO REPORT' : 'CITIZEN REPORT'}
          </div>
          <h1>{r.title}</h1>
          <p className="location">
            <MapPin size={14} />
            {r.area} · Reported{' '}
            {new Date(r.created_at).toLocaleString('en-GB', {
              timeZone: 'Asia/Dhaka',
              dateStyle: 'medium',
              timeStyle: 'short',
            })}{' '}
            Bangladesh time
          </p>
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-photo">
            {r.image_url ? (
              <img src={r.image_url} alt={`Evidence: ${r.title}`} />
            ) : (
              <div className="photo-placeholder">
                <CategoryIcon category={r.category} size={50} />
                <span>No photograph attached to this demo report</span>
              </div>
            )}
          </div>
          <div className="panel">
            <div className="detail-meta">
              <Badge value={r.status} />
              <Badge value={r.severity} prefix="Severity: " />
              <Badge value={r.category} />
            </div>
            <h2>From the community</h2>
            <p>{r.description}</p>
            {r.latitude !== null && (
              <p>
                Coordinates: {r.latitude}, {r.longitude}
              </p>
            )}
            <div className="explanation">
              <strong>
                <ScanLine
                  size={15}
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: 7 }}
                />
                {r.analysis_source === 'vision'
                  ? 'AI assessment'
                  : r.analysis_source === 'mock'
                    ? 'Demo analysis · not a real AI assessment'
                    : 'Analysis unavailable · human review required'}
              </strong>
              <p>{r.ai_summary}</p>
              <p>{r.ai_reasoning}</p>
            </div>
            <h3>Progress</h3>
            <div className="status-track">
              {statuses.map((s, i) => (
                <span key={s} className={i <= statuses.indexOf(r.status) ? 'done' : ''}>
                  {label(s)}
                </span>
              ))}
            </div>
            <small className="subtle">
              Last updated {new Date(r.updated_at).toLocaleString('en-GB', {
                timeZone: 'Asia/Dhaka',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} Bangladesh time
            </small>
          </div>
        </div>
        <aside>
          <div className="panel score-panel">
            <div className="eyebrow">TRANSPARENT PRIORITIZATION</div>
            <h2>Why this comes first</h2>
            <div className="score-hero">
              <strong>{r.risk_score}</strong>
              <span> / 100</span>
              <Badge value={r.risk.level} prefix="Priority: " />
            </div>
            <div className="score-part">
              <span>Severity · {label(r.severity)}</span>
              <b>{r.risk.severity} / 50</b>
            </div>
            <div className="score-part">
              <span>
                Frequency · {r.related_count} total report{r.related_count !== 1 ? 's' : ''}
              </span>
              <b>{r.risk.frequency} / 30</b>
            </div>
            <div className="score-part">
              <span>Recency</span>
              <b>{r.risk.recency} / 20</b>
            </div>
            <div className="related-note">
              {r.related_count - 1} possible related report{r.related_count === 2 ? '' : 's'}{' '}
              detected in this area.
            </div>
            <p>
              Related reports share a category and normalized area, are unresolved, and were
              submitted in the past 7 days. This is an explainable signal, not confirmed duplicate
              detection.
            </p>
            <p>
              AI interprets the evidence. A deterministic risk engine calculates priority. Scores
              refresh as reports age and related issues change.
            </p>
            {r.status === 'resolved' && (
              <div className="notice">
                Resolved issues are excluded from the active priority queue.
              </div>
            )}
            <Link href="/dashboard" className="button secondary full">
              View risk dashboard
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
