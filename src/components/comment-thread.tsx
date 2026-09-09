"use client";

import { useMemo, useState } from "react";

import {
  AttachButton,
  AttachmentDraftTray,
  AttachmentList,
  useAttachmentDraft,
} from "@/components/attachments";
import { Avatar, Button, cx, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useCreateComment, useDeleteComment } from "@/lib/api/hooks";
import type { CommentDto } from "@/lib/contracts/interactions";
import { relativeTime } from "@/lib/time";

type Node = CommentDto & { replies: Node[] };

function buildTree(comments: CommentDto[]): Node[] {
  const byId = new Map<string, Node>();
  comments.forEach((c) => byId.set(c.id, { ...c, replies: [] }));
  const roots: Node[] = [];
  byId.forEach((node) => {
    if (node.parentCommentId && byId.has(node.parentCommentId)) {
      byId.get(node.parentCommentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function CommentThread({
  postId,
  comments,
  onChanged,
}: {
  postId: string;
  comments: CommentDto[];
  onChanged: () => void;
}) {
  const tree = useMemo(() => buildTree(comments), [comments]);
  const createComment = useCreateComment(postId);
  const [body, setBody] = useState("");
  const attachments = useAttachmentDraft();

  async function submitTop(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && attachments.inputs.length === 0) return;
    await createComment.mutateAsync({
      body: body.trim(),
      attachments: attachments.inputs,
    });
    setBody("");
    attachments.clear();
    onChanged();
  }

  return (
    <div>
      <form onSubmit={submitTop} className="px-4 py-3 md:px-0">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="min-h-[64px]"
        />
        <AttachmentDraftTray draft={attachments} />
        <div className="mt-2 flex items-center gap-2">
          <AttachButton draft={attachments} />
          <Button
            type="submit"
            size="sm"
            disabled={
              createComment.isPending ||
              attachments.uploading ||
              (!body.trim() && attachments.inputs.length === 0)
            }
          >
            {attachments.uploading ? "Uploading…" : "Comment"}
          </Button>
        </div>
      </form>

      {tree.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted md:px-0">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <ul>
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              postId={postId}
              depth={0}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  node,
  postId,
  depth,
  onChanged,
}: {
  node: Node;
  postId: string;
  depth: number;
  onChanged: () => void;
}) {
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const replyAttachments = useAttachmentDraft();
  const [helpful, setHelpful] = useState(node.viewerHasMarkedHelpful);
  const [count, setCount] = useState(node.helpfulCount);

  async function toggleHelpful() {
    const next = !helpful;
    setHelpful(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await api<{ marked: boolean; count: number }>("/api/helpful", {
        method: "POST",
        body: { targetType: "comment", targetId: node.id },
      });
      setHelpful(res.marked);
      setCount(res.count);
    } catch {
      setHelpful(!next);
      setCount((c) => c - (next ? 1 : -1));
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() && replyAttachments.inputs.length === 0) return;
    await createComment.mutateAsync({
      body: replyBody.trim(),
      parentCommentId: node.id,
      attachments: replyAttachments.inputs,
    });
    setReplyBody("");
    replyAttachments.clear();
    setReplying(false);
    onChanged();
  }

  return (
    <li
      className={cx(
        "border-b border-border px-4 py-3 md:px-0",
        depth > 0 && "ml-4 border-l border-border pl-3 md:ml-6",
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Avatar username={node.author.username} src={node.author.avatarUrl} size={28} />
        <span className="font-semibold text-navy">@{node.author.username}</span>
        <span className="text-muted">· {relativeTime(node.createdAt)}</span>
      </div>

      {node.body && (
        <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-6 text-navy">
          {node.body}
        </p>
      )}

      {node.attachments.length > 0 && (
        <AttachmentList attachments={node.attachments} className="mt-2" />
      )}

      <div className="mt-1.5 flex items-center gap-4 text-sm text-muted">
        <button
          onClick={toggleHelpful}
          className={cx("font-semibold", helpful && "text-brand-blue")}
        >
          👍 {count}
        </button>
        <button onClick={() => setReplying((v) => !v)} className="font-semibold">
          Reply
        </button>
        {node.isAuthor && (
          <button
            onClick={async () => {
              await deleteComment.mutateAsync(node.id);
              onChanged();
            }}
            className="font-semibold text-red-600"
          >
            Delete
          </button>
        )}
      </div>

      {replying && (
        <form onSubmit={submitReply} className="mt-2">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Reply to @${node.author.username}…`}
            className="min-h-[56px]"
            autoFocus
          />
          <AttachmentDraftTray draft={replyAttachments} />
          <div className="mt-2 flex items-center gap-2">
            <AttachButton draft={replyAttachments} />
            <Button
              type="submit"
              size="sm"
              disabled={createComment.isPending || replyAttachments.uploading}
            >
              {replyAttachments.uploading ? "Uploading…" : "Reply"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setReplying(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {node.replies.length > 0 && (
        <ul className="mt-2">
          {node.replies.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              postId={postId}
              depth={depth + 1}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
