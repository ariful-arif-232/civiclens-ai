import Link from 'next/link';
import {
  AlertCircle,
  MapPin,
  ArrowUpRight,
  Construction,
  Lightbulb,
  Trash2,
  Droplets,
  Waves,
  Building2,
  ScanLine,
} from 'lucide-react';
import { label, type Category, type ScoredReport } from '@/lib/types';
export function CategoryIcon({ category, size = 22 }: { category: Category; size?: number }) {
  const Icon = {
    road_damage: Construction,
    streetlight: Lightbulb,
    garbage: Trash2,
    water_leakage: Droplets,
    drainage: Waves,
    public_facility: Building2,
    other: ScanLine,
  }[category];
  return <Icon size={size} />;
}
export function Badge({ value, prefix }: { value: string; prefix?: string }) {
  return (
    <span className={`badge ${value.toLowerCase()}`}>
      {prefix}
      {label(value)}
    </span>
  );
}
export function RiskBadge({ report }: { report: ScoredReport }) {
  return (
    <span className={`risk-badge ${report.risk.level.toLowerCase()}`}>
      <strong>{report.risk_score}</strong>
      <span>
        {report.risk.level}
        <small>priority</small>
      </span>
    </span>
  );
}
export function EmptyState({
  title = 'No reports yet',
  description = 'A better place starts with one report.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <ScanLine size={35} />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href="/report" className="button secondary">
        Report an issue <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={20} />
      <span>{message}</span>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function ReportCard({ report: r }: { report: ScoredReport }) {
  return (
    <Link href={`/issues/${r.id}`} className="report-card">
      <div className={`report-photo ${r.category}`}>
        {r.image_url ? (
          <img src={r.image_url} alt={r.title} />
        ) : (
          <div className="photo-placeholder">
            <CategoryIcon category={r.category} size={40} />
            <span>Demo report · no photograph</span>
          </div>
        )}
        <span className="photo-status">
          <Badge value={r.status} />
        </span>
      </div>
      <div className="report-card-body">
        <div className="card-meta">
          <span>{label(r.category)}</span>
          <span>
            {new Date(r.created_at).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Dhaka',
            })}
          </span>
        </div>
        <h3>{r.title}</h3>
        <p className="location">
          <MapPin size={14} />
          {r.area}
        </p>
        <div className="card-bottom">
          <RiskBadge report={r} />
          <span className="round-arrow">
            <ArrowUpRight size={19} />
          </span>
        </div>
        {r.analysis_source !== 'vision' && (
          <small className="source-note">
            {r.analysis_source === 'mock' ? 'Demo analysis' : 'Awaiting human assessment'}
          </small>
        )}
      </div>
    </Link>
  );
}
