'use client';
import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { Upload, ScanLine, CheckCircle2, ArrowUpRight, MapPin } from 'lucide-react';
import { reportInput, MAX_IMAGE_BYTES } from '@/lib/validation';
import { label, type ScoredReport } from '@/lib/types';
import { Badge, ErrorState, RiskBadge } from './ui';
export function ReportForm({ demo }: { demo: boolean }) {
  const [photo, setPhoto] = useState<File | null>(null),
    [preview, setPreview] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState(''),
    [result, setResult] = useState<ScoredReport | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = reportInput.safeParse(
      Object.fromEntries([...form.entries()].filter(([key]) => key !== 'photo')),
    );
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => `${label(String(i.path[0] || 'Form'))}: ${i.message}`)
          .join(' '),
      );
      return;
    }
    if (!photo) {
      setError('Please select a photograph.');
      return;
    }
    setBusy(true);
    setPhase('Uploading and checking your photo…');
    const timer = setTimeout(
      () =>
        setPhase(
          demo
            ? 'Simulating analysis and calculating priority…'
            : 'Analyzing evidence and calculating priority…',
        ),
      1500,
    );
    try {
      const response = await fetch('/api/reports', { method: 'POST', body: form });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(response.status === 413 ? 'Photo too large. Choose an image under 4 MB.' : 'The server is temporarily unavailable. Please retry.');
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed.');
      setResult(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit. Please retry.');
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  if (result)
    return (
      <div className="panel success-panel">
        <span className="success-icon">
          <CheckCircle2 size={32} />
        </span>
        <div className="eyebrow">YOUR VOICE IS NOW PART OF THE PICTURE</div>
        <h2>Report received.</h2>
        <p>Your issue has been saved and added to the intelligence dashboard.</p>
        <div className="success-result">
          <RiskBadge report={result} />
          <Badge value={result.severity} prefix="Severity: " />
          <Badge value={result.status} />
        </div>
        <h3>{label(result.category)}</h3>
        <p>{result.ai_summary}</p>
        <div className="explanation">
          <strong>
            {result.analysis_source === 'vision'
              ? 'AI reasoning'
              : result.analysis_source === 'mock'
                ? 'Simulated analysis · not real AI'
                : 'Needs human review'}
          </strong>
          <p>{result.ai_reasoning}</p>
        </div>
        <Link href={`/issues/${result.id}`} className="button">
          View report and priority breakdown <ArrowUpRight size={17} />
        </Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="panel report-form">
      <div className="form-step">
        <span>01</span>
        <h2>Show us the issue</h2>
      </div>
      <label className={`upload-zone ${preview ? 'has-preview' : ''}`}>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={busy}
          aria-label="Issue photograph"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setError('');
            if (!file) return;
            if (
              file.size > MAX_IMAGE_BYTES ||
              !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            ) {
              setError('Choose a JPEG, PNG or WebP photo up to 4 MB.');
              event.target.value = '';
              setPhoto(null);
              setPreview('');
              return;
            }
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? (
          <img src={preview} alt="Selected issue photograph preview" />
        ) : (
          <>
            <span className="icon-box">
              <Upload size={27} />
            </span>
            <strong>Click to upload a photo</strong>
            <span>A clear photo helps us understand the issue.</span>
            <small>JPG, PNG or WebP · Up to 4 MB</small>
          </>
        )}
        {preview && <span className="replace-photo">Click to replace photo</span>}
      </label>
      <div className="form-step">
        <span>02</span>
        <h2>Add a little context</h2>
      </div>
      <label>
        Issue title / সমস্যার নাম
        <input
          name="title"
          placeholder="e.g. Deep pothole / রাস্তার বড় গর্ত / rastay boro gorto"
          minLength={5}
          maxLength={120}
          required
          disabled={busy}
        />
        <small className="subtle">English, বাংলা বা Banglish — যেভাবে স্বাভাবিকভাবে লিখেন সেভাবেই লিখতে পারেন।</small>
      </label>
      <label>
        What’s happening? / কী সমস্যা হচ্ছে?
        <textarea
          name="description"
          placeholder="e.g. Gorto ta onek deep, gari control harale accident hote pare / গর্তটা অনেক গভীর…"
          minLength={15}
          maxLength={3000}
          rows={4}
          required
          disabled={busy}
        />
      </label>
      <label>
        Area or landmark
        <div className="input-icon">
          <MapPin size={16} />
          <input
            name="area"
            placeholder="e.g. University Main Gate"
            minLength={2}
            maxLength={100}
            required
            disabled={busy}
          />
        </div>
      </label>
      <details className="coordinates">
        <summary>Add exact coordinates (optional)</summary>
        <div className="form-grid">
          <label>
            Latitude
            <input
              name="latitude"
              type="number"
              min="-90"
              max="90"
              step="any"
              placeholder="23.8103"
              disabled={busy}
            />
          </label>
          <label>
            Longitude
            <input
              name="longitude"
              type="number"
              min="-180"
              max="180"
              step="any"
              placeholder="90.4125"
              disabled={busy}
            />
          </label>
        </div>
      </details>
      <p className="privacy-note">
        Reports and photos are visible to other visitors. Avoid faces, personal information and
        private addresses. Photo metadata is removed before storage. Photos and descriptions are sent to Cloudinary and Google Gemini for processing; free-tier AI inputs may be used to improve provider products.
      </p>
      {error && <ErrorState message={error} />}
      <button type="submit" className="button full" disabled={busy}>
        {busy ? (
          <>
            <span className="spinner" />
            {phase}
          </>
        ) : (
          <>
            <ScanLine size={18} />
            {demo ? 'Submit with demo analysis' : 'Submit for AI analysis'}
            <ArrowUpRight size={18} />
          </>
        )}
      </button>
      <p className="form-footnote" role="status" aria-live="polite">
        {busy
          ? 'Keep this page open while we process your report.'
          : 'Every report helps build a clearer picture.'}
      </p>
    </form>
  );
}
