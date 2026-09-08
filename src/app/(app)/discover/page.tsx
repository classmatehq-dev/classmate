import { requireCompletedUser } from "@/server/auth/guards";
import { EmptyState, Input } from "@/components/ui";

export default async function DiscoverPage() {
  await requireCompletedUser();
  return (
    <div className="px-4 py-4 md:px-0">
      <h1 className="text-xl font-extrabold text-navy">Discover</h1>
      <Input
        className="mt-3"
        placeholder="Search students, classes, schools, and teachers"
        aria-label="Search"
      />
      <div className="mt-6">
        <EmptyState
          title="Discovery is coming soon"
          description="Search across every class and student on Classmate, and find classes outside your own."
        />
      </div>
    </div>
  );
}
