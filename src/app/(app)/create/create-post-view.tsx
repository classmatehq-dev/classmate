"use client";

import { PostComposer } from "@/components/post-composer";
import { ButtonLink, Card, EmptyState, Skeleton } from "@/components/ui";
import { useMyClasses } from "@/lib/api/hooks";

export function CreatePostView() {
  const myClasses = useMyClasses();

  return (
    <div className="animate-rise px-4 py-4 md:px-0">
      <h1 className="text-xl font-extrabold text-navy">Create a post</h1>
      <p className="mt-1 text-sm text-muted">
        Share notes, ask a question, or start a discussion with your class.
      </p>

      <div className="mt-5">
        {myClasses.isLoading ? (
          <Skeleton className="h-64 w-full rounded-card" />
        ) : myClasses.data && myClasses.data.length === 0 ? (
          <EmptyState
            icon="🎒"
            title="Join a class first"
            description="You need to be in a class before you can post."
            action={
              <ButtonLink href="/classes/add" size="sm">
                Add a class
              </ButtonLink>
            }
          />
        ) : (
          <Card>
            <PostComposer />
          </Card>
        )}
      </div>
    </div>
  );
}
