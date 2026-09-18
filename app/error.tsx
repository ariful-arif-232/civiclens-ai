'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container empty">
      <h1>We couldn’t load this view.</h1>
      <p>
        Please retry. If this persists, check that the server database configuration is complete.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
