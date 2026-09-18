'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  categories,
  severities,
  statuses,
  label,
  type ScoredReport,
  type Status,
} from '@/lib/types';
import { transitions } from '@/lib/validation';
import { ReportCard, EmptyState, ErrorState, Badge, RiskBadge } from './ui';
export function IssueBrowser({
  admin = false,
  initialArea = '',
}: {
  admin?: boolean;
  initialArea?: string;
}) {
  const [category, setCategory] = useState(''),
    [severity, setSeverity] = useState(''),
    [status, setStatus] = useState(''),
    [area, setArea] = useState(initialArea),
    [sort, setSort] = useState('risk'),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<{ reports: ScoredReport[]; total: number } | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [token, setToken] = useState(''),
    [notice, setNotice] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams({ sort, page: String(page), limit: '12' });
    for (const [key, value] of Object.entries({ category, severity, status, area }))
      if (value) params.set(key, value);
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/reports?${params}`, {
          signal: abort.signal,
          cache: 'no-store',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setData(body);
      } catch (e) {
        if (!abort.signal.aborted)
          setError(e instanceof Error ? e.message : 'Could not load reports.');
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [category, severity, status, area, sort, page, refresh]);
  function select(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
    setNotice('');
  }
  return (
    <>
      {admin && (
        <div className="panel admin-access">
          <div>
            <h2>Authority workspace</h2>
            <p>
              Enter your authority token to update statuses. It stays in this tab’s memory only.
            </p>
          </div>
          <label>
            Authority access token
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your configured admin token"
            />
          </label>
        </div>
      )}
      <div className="filters">
        <label className="search-area">
          AREA
          <input
            type="search"
            placeholder="Search area or landmark…"
            value={area}
            onChange={(e) => select(setArea, e.target.value)}
          />
        </label>
        {[
          { title: 'CATEGORY', options: categories, value: category, set: setCategory },
          { title: 'SEVERITY', options: severities, value: severity, set: setSeverity },
          { title: 'STATUS', options: statuses, value: status, set: setStatus },
        ].map((f) => (
          <label key={f.title}>
            {f.title}
            <select
              aria-label={f.title}
              value={f.value}
              onChange={(e) => select(f.set, e.target.value)}
            >
              <option value="">All {f.title.toLowerCase()}</option>
              {f.options.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          SORT BY
          <select
            aria-label="Sort by"
            value={sort}
            onChange={(e) => select(setSort, e.target.value)}
          >
            <option value="risk">Highest risk</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
      </div>
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {error ? (
        <>
          <ErrorState message={error} />
          <button className="button secondary" onClick={() => setRefresh((v) => v + 1)}>
            Retry loading
          </button>
        </>
      ) : loading ? (
        <div className="loading" role="status">
          <span className="spinner" /> Updating the picture…
        </div>
      ) : (
        data && (
          <>
            <div className="results-line">
              <span>
                {data.total} report{data.total !== 1 ? 's' : ''} found
              </span>
              <span>Priority refreshed on every view</span>
            </div>
            {!data.reports.length ? (
              <EmptyState
                title="No matching issues"
                description="Try another area or clear the filters to see more reports."
              />
            ) : admin ? (
              <div className="panel table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ISSUE / AREA</th>
                      <th>PRIORITY</th>
                      <th>SEVERITY</th>
                      <th>ASSESSMENT</th>
                      <th>STATUS & NEXT ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/issues/${r.id}`}>
                            <h3>{r.title} ↗</h3>
                          </Link>
                          <p>{r.area}</p>
                        </td>
                        <td>
                          <RiskBadge report={r} />
                        </td>
                        <td>
                          <Badge value={r.severity} />
                        </td>
                        <td>
                          <details>
                            <summary>
                              {r.analysis_source === 'vision'
                                ? 'AI reasoning'
                                : r.analysis_source === 'mock'
                                  ? 'Demo reasoning'
                                  : 'Human review needed'}
                            </summary>
                            <p>{r.ai_reasoning}</p>
                          </details>
                        </td>
                        <td>
                          <StatusControl
                            report={r}
                            token={token}
                            onSaved={() => {
                              setNotice(
                                'Status updated successfully. Priorities have been refreshed.',
                              );
                              setRefresh((v) => v + 1);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reports-grid">
                {data.reports.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            )}
            {data.total > 12 && (
              <div className="pagination">
                <button
                  className="button secondary small"
                  disabled={page === 1}
                  onClick={() => setPage((v) => v - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {Math.ceil(data.total / 12)}
                </span>
                <button
                  className="button secondary small"
                  disabled={page * 12 >= data.total}
                  onClick={() => setPage((v) => v + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )
      )}
    </>
  );
}
function StatusControl({
  report,
  token,
  onSaved,
}: {
  report: ScoredReport;
  token: string;
  onSaved: () => void;
}) {
  const [next, setNext] = useState<Status | ''>(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function save() {
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next, expectedStatus: report.status }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setNext('');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Badge value={report.status} />
      <div className="status-control" style={{ marginTop: 9 }}>
        <select
          aria-label={`Next status for ${report.title}`}
          value={next}
          onChange={(e) => setNext(e.target.value as Status)}
          disabled={busy}
        >
          <option value="">Next status…</option>
          {transitions[report.status].map((s) => (
            <option value={s} key={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <button className="button" disabled={!next || !token || busy} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: '#aa4c32', marginTop: 7 }}>
          {error}
        </p>
      )}
    </>
  );
}
