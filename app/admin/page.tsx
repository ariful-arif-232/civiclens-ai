import { PageHeading } from '@/components/ui';
import { IssueBrowser } from '@/components/IssueBrowser';
export const metadata = { title: 'Authority workspace' };
export default function Admin() {
  return (
    <div className="container page">
      <PageHeading
        eyebrow="FROM INTELLIGENCE TO ACTION"
        title="The right next step."
        description="Review evidence, move issues forward, and keep your community informed."
      />
      <IssueBrowser admin />
    </div>
  );
}
