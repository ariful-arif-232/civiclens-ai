import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ScanLine,
  Camera,
  ChartNoAxesCombined,
  ShieldCheck,
  MapPin,
  Activity,
} from 'lucide-react';
export default function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot" /> SEE THE ISSUE. SEE THE BIGGER PICTURE.
          </div>
          <h1>
            Every report.
            <br />A clearer picture.
            <br />
            <span>A better place.</span>
          </h1>
          <p>
            From citizen reports to actionable infrastructure intelligence. Turn everyday
            observations into the priorities that move your community forward.
          </p>
          <div className="hero-actions">
            <Link href="/report" className="button">
              Report an issue <ArrowUpRight size={19} />
            </Link>
            <Link href="/dashboard" className="button secondary">
              View risk dashboard <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-proof">
            <ShieldCheck size={16} />
            <span>AI-powered understanding</span>
            <i />
            <span>Transparent priorities</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a civic intelligence dashboard">
          <div className="visual-label">
            <span>
              <Activity size={15} /> THE COMMUNITY, IN FOCUS
            </span>
            <span className="live-pill">Intelligence preview</span>
          </div>
          <div className="city-grid">
            <div className="city-block b1" />
            <div className="city-block b2" />
            <div className="city-block b3" />
            <div className="city-block b4" />
            <div className="city-block b5" />
            <div className="city-block b6" />
            <div className="city-park">
              <span>
                University
                <br />
                campus
              </span>
            </div>
            <div className="road horizontal" />
            <div className="road vertical" />
            <div className="map-pin pin-one">
              <MapPin size={23} />
            </div>
            <div className="map-pin pin-two">
              <MapPin size={21} />
            </div>
            <div className="map-pin pin-three">
              <MapPin size={19} />
            </div>
            <div className="map-caption">ILLUSTRATIVE VIEW · NOT A LIVE MAP</div>
          </div>
          <div className="floating-insight">
            <div className="insight-icon">
              <ScanLine size={23} />
            </div>
            <div>
              <span className="eyebrow">A REPORT BECOMES A PRIORITY</span>
              <h3>University Main Gate</h3>
              <p>Road damage · 4 recent reports</p>
            </div>
            <div className="insight-score">
              <strong>90</strong>
              <span>Critical</span>
            </div>
          </div>
          <div className="visual-bottom">
            <span>
              <span className="dot" /> Evidence connected. Action made clear.
            </span>
            <ArrowUpRight size={18} />
          </div>
        </div>
      </section>
      <section className="principle-strip">
        <div className="container">
          <span>BEYOND THE COMPLAINT BOX</span>
          <h2>
            Don’t just collect reports.
            <br />
            <em>Know what to fix first.</em>
          </h2>
          <p>
            One report reveals an issue. Connected reports reveal a pattern. CivicLens helps
            authorities see both, with an explainable priority for every issue.
          </p>
        </div>
      </section>
      <section className="container steps-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FROM OBSERVATION TO ACTION</div>
            <h2>A simpler path to a better community.</h2>
          </div>
          <span className="subtle">Three steps. One shared purpose.</span>
        </div>
        <div className="steps">
          {[
            {
              n: '01',
              icon: Camera,
              title: 'Citizens report',
              text: 'A photo, a few details and a location. Give the issues around you a voice.',
            },
            {
              n: '02',
              icon: ScanLine,
              title: 'AI understands',
              text: 'Vision AI turns images and descriptions into a category, severity and clear explanation.',
            },
            {
              n: '03',
              icon: ChartNoAxesCombined,
              title: 'Authorities prioritize',
              text: 'A deterministic engine combines severity, frequency and recency to guide the next action.',
            },
          ].map(({ n, icon: Icon, title, text }) => (
            <article key={n}>
              <div className="step-top">
                <span className="icon-box">
                  <Icon size={24} />
                </span>
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="container">
        <div className="bottom-cta">
          <div className="eyebrow">SMALL OBSERVATIONS. MEANINGFUL CHANGE.</div>
          <h2>
            Your community looks better
            <br />
            when everyone looks out for it.
          </h2>
          <Link href="/report" className="button">
            Make your first report <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
