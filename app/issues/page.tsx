import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeading } from '@/components/ui';
import { IssueBrowser } from '@/components/IssueBrowser';
export const metadata = { title: 'Explore issues' };
export default async function Issues({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container page">
      <PageHeading
        eyebrow="COMMUNITY PULSE"
        title="Every issue, in view."
        description="Explore what’s being reported and follow the progress around you."
      >
        <Link href="/report" className="button">
          <Plus size={17} />
          Report an issue
        </Link>
      </PageHeading>
      <IssueBrowser initialArea={typeof params.area === 'string' ? params.area : ''} />
    </div>
  );
}
