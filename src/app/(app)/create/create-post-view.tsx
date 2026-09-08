"use client";

import { EmptyState, ButtonLink } from "@/components/ui";
import { PostComposer } from "@/components/post-composer";
import { useMyClasses } from "@/lib/api/hooks";

export function CreatePostView() {
  const myClasses = useMyClasses();

  return (
    <div className="px-4 py-4 md:px-0">
      <h1 className="text-xl font-extrabold text-navy">Create a post</h1>
      <p className="mt-1 text-sm text-muted">
        Posts are shared with everyone in the class you choose.
      </p>

      <div className="mt-5">
        {myClasses.data && myClasses.data.length === 0 ? (
          <EmptyState
            title="Join a class first"
            description="You need to be in a class before you can post."
            action={
              <ButtonLink href="/classes/add" size="sm">
                Add Class
              </ButtonLink>
            }
          />
        ) : (
          <PostComposer />
        )}
      </div>
    </div>
  );
}
