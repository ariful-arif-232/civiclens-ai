import { ReportForm } from '@/components/ReportForm';
import { PageHeading } from '@/components/ui';
import { isDemo } from '@/lib/runtime';
import { ScanLine, ChartNoAxesCombined, ShieldCheck } from 'lucide-react';
export const metadata = { title: 'Report an issue' };
export default function ReportPage() {
  return (
    <div className="container page">
      <PageHeading
        eyebrow="CITIZEN REPORTING"
        title="See something? Make it count."
        description="A photo and a few details can help make your community safer."
      />
      <div className="report-layout">
        <ReportForm demo={isDemo()} />
        <aside className="report-aside">
          <div className="eyebrow">WHAT HAPPENS NEXT</div>
          <h2>
            Your report does
            <br />
            more than you think.
          </h2>
          {[
            {
              icon: ScanLine,
              title: 'Evidence becomes understanding',
              text: 'Vision AI identifies the issue, estimates severity and explains what it found.',
            },
            {
              icon: ChartNoAxesCombined,
              title: 'Understanding becomes priority',
              text: 'Severity, related reports and recency combine into a transparent score out of 100.',
            },
            {
              icon: ShieldCheck,
              title: 'A clear path to action',
              text: 'Authorities can review your report, prioritize it and keep its status up to date.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div className="aside-item" key={title}>
              <Icon size={22} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
          <div className="aside-note">
            AI supports human judgment. It does not replace an on-site safety assessment.
          </div>
        </aside>
      </div>
    </div>
  );
}
