import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container empty">
      <h1>This report isn’t here.</h1>
      <p>The link may be incorrect or the report may no longer exist.</p>
      <Link href="/issues" className="button">
        Explore issues
      </Link>
    </div>
  );
}
