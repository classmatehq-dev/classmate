"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { api } from "./client";
import type { ClassDto, JoinClassResponse } from "@/lib/contracts/classes";
import type { FeedItemDto, FeedResponse } from "@/lib/contracts/feed";
import type {
  CommentDto,
  CreateCommentBody,
  CreatePostBody,
  ListPostsResponse,
  PostDto,
} from "@/lib/contracts/interactions";
import type {
  CreateProfileBody,
  MeDto,
  MyClassDto,
  UpdateProfileBody,
} from "@/lib/contracts/me";
import type { DiscoverResponse } from "@/lib/contracts/discover";
import type { LeaderboardResponse } from "@/lib/contracts/leaderboard";
import type {
  FollowResponse,
  PublicProfileDto,
} from "@/lib/contracts/profile";
import type { SchoolDto } from "@/lib/contracts/schools";
import type {
  ConversationDto,
  CreateGroupBody,
  ListConversationsResponse,
  ListMessagesResponse,
  MessageDto,
  StartDirectBody,
  UnreadCountResponse,
} from "@/lib/contracts/messages";
import type { AttachmentInput } from "@/lib/contracts/attachments";
import type {
  ListNotificationsResponse,
  NotificationsUnreadResponse,
} from "@/lib/contracts/notifications";

export const qk = {
  me: ["me"] as const,
  myClasses: ["me", "classes"] as const,
  homeFeed: ["home", "feed"] as const,
  schools: (params: Record<string, unknown>) => ["schools", params] as const,
  classes: (params: Record<string, unknown>) => ["classes", params] as const,
  class: (id: string) => ["classes", id] as const,
};

type MeResponse = { authenticated: boolean; profile: MeDto | null };

export function useMe(options?: Partial<UseQueryOptions<MeResponse>>) {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<MeResponse>("/api/me"),
    ...options,
  });
}

export function useMyClasses() {
  return useQuery({
    queryKey: qk.myClasses,
    queryFn: () => api<MyClassDto[]>("/api/me/classes"),
  });
}

export function useHomeFeed() {
  return useQuery({
    queryKey: qk.homeFeed,
    queryFn: () => api<FeedResponse>("/api/home/feed", { query: { limit: 15 } }),
  });
}

export function useListSchools(params: {
  state?: string;
  q?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...query } = params;
  return useQuery({
    queryKey: qk.schools(query),
    queryFn: () => api<SchoolDto[]>("/api/schools", { query }),
    enabled,
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; state: string; city?: string }) =>
      api<SchoolDto>("/api/schools", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schools"] }),
  });
}

export function useListClasses(params: {
  schoolId: string;
  teacherId?: string;
  q?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...query } = params;
  return useQuery({
    queryKey: qk.classes(query),
    queryFn: () => api<ClassDto[]>("/api/classes", { query }),
    enabled: enabled && Boolean(params.schoolId),
  });
}

export function useClass(id: string | undefined) {
  return useQuery({
    queryKey: qk.class(id ?? "none"),
    queryFn: () => api<ClassDto>(`/api/classes/${id}`),
    enabled: Boolean(id),
  });
}

export function useClassSections(id: string | undefined) {
  return useQuery({
    queryKey: ["classes", id, "sections"],
    queryFn: () => api<ClassDto[]>(`/api/classes/${id}/sections`),
    enabled: Boolean(id),
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      schoolId: string;
      name: string;
      teacherId?: string;
      teacherName?: string;
      courseLevel?: string;
    }) =>
      api<{ class: ClassDto; created: boolean }>("/api/classes", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: qk.myClasses });
    },
  });
}

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      api<JoinClassResponse>(`/api/classes/${classId}/join`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: qk.myClasses });
      qc.invalidateQueries({ queryKey: qk.homeFeed });
    },
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProfileBody) =>
      api<MeDto>("/api/me", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) =>
      api<MeDto>("/api/me", { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

export function useSetSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schoolId: string) =>
      api<MeDto>("/api/me/school", { method: "PUT", body: { schoolId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<MeDto>("/api/me/complete-onboarding", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.myClasses });
    },
  });
}

// ---------------------------------------------------------------------------
// Posts + comments
// ---------------------------------------------------------------------------

export function useClassPosts(classId: string | undefined) {
  return useQuery({
    queryKey: ["classes", classId, "posts"],
    queryFn: () =>
      api<ListPostsResponse>(`/api/classes/${classId}/posts`, {
        query: { limit: 20 },
      }),
    enabled: Boolean(classId),
  });
}

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ["posts", postId],
    queryFn: () => api<PostDto>(`/api/posts/${postId}`),
    enabled: Boolean(postId),
  });
}

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["posts", postId, "comments"],
    queryFn: () => api<CommentDto[]>(`/api/posts/${postId}/comments`),
    enabled: Boolean(postId),
  });
}

export function useCreatePost(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePostBody) =>
      api<PostDto>(`/api/classes/${classId}/posts`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", classId, "posts"] });
      qc.invalidateQueries({ queryKey: qk.homeFeed });
      qc.invalidateQueries({ queryKey: qk.myClasses });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      api<{ ok: true }>(`/api/posts/${postId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: qk.homeFeed });
    },
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommentBody) =>
      api<CommentDto>(`/api/posts/${postId}/comments`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api<{ ok: true }>(`/api/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export function useProfile(username: string | undefined) {
  return useQuery({
    queryKey: ["users", username],
    queryFn: () => api<PublicProfileDto>(`/api/users/${username}`),
    enabled: Boolean(username),
  });
}

export function useProfilePosts(username: string | undefined) {
  return useQuery({
    queryKey: ["users", username, "posts"],
    queryFn: () => api<FeedItemDto[]>(`/api/users/${username}/posts`),
    enabled: Boolean(username),
  });
}

export function useToggleFollow(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<FollowResponse>(`/api/users/${username}/follow`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", username] }),
  });
}

export function useDiscover(q: string) {
  return useQuery({
    queryKey: ["discover", q],
    queryFn: () => api<DiscoverResponse>("/api/discover", { query: { q } }),
    placeholderData: (prev) => prev,
  });
}

export function useLeaderboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api<LeaderboardResponse>("/api/leaderboard"),
    enabled: options?.enabled ?? true,
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messageKeys = {
  conversations: ["conversations"] as const,
  conversation: (id: string) => ["conversations", id] as const,
  messages: (id: string) => ["conversations", id, "messages"] as const,
  unread: ["conversations", "unread-count"] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: messageKeys.conversations,
    queryFn: () =>
      api<ListConversationsResponse>("/api/conversations"),
    refetchInterval: 8000,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: messageKeys.conversation(id ?? "none"),
    queryFn: () => api<ConversationDto>(`/api/conversations/${id}`),
    enabled: Boolean(id),
  });
}

/** Thread messages. Polls while the tab is focused so chat feels live. */
export function useMessages(id: string | undefined) {
  return useQuery({
    queryKey: messageKeys.messages(id ?? "none"),
    queryFn: () =>
      api<ListMessagesResponse>(`/api/conversations/${id}/messages`, {
        query: { limit: 40 },
      }),
    enabled: Boolean(id),
    refetchInterval: 3500,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: messageKeys.unread,
    queryFn: () =>
      api<UnreadCountResponse>("/api/conversations/unread-count"),
    refetchInterval: 15000,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body?: string; attachments?: AttachmentInput[] }) =>
      api<MessageDto>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body,
      }),
    // drop the real message straight into the thread so it feels instant
    onSuccess: (message) => {
      qc.setQueryData<ListMessagesResponse>(
        messageKeys.messages(conversationId),
        (prev) =>
          prev && !prev.items.some((m) => m.id === message.id)
            ? { ...prev, items: [...prev.items, message] }
            : prev,
      );
      qc.invalidateQueries({
        queryKey: messageKeys.messages(conversationId),
      });
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
      qc.invalidateQueries({ queryKey: messageKeys.unread });
    },
  });
}

export function useStartDirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StartDirectBody) =>
      api<ConversationDto>("/api/conversations", {
        method: "POST",
        body: { kind: "direct", ...body },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageKeys.conversations }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) =>
      api<ConversationDto>("/api/conversations", {
        method: "POST",
        body: { kind: "group", ...body },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageKeys.conversations }),
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api<{ ok: true }>(`/api/conversations/${conversationId}/read`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
      qc.invalidateQueries({ queryKey: messageKeys.unread });
    },
  });
}

export function useAddGroupMembers(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (usernames: string[]) =>
      api<ConversationDto>(
        `/api/conversations/${conversationId}/members`,
        { method: "POST", body: { usernames } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: messageKeys.conversation(conversationId),
      });
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}

export function useLeaveConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api<{ ok: true }>(`/api/conversations/${conversationId}/leave`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
      qc.invalidateQueries({ queryKey: messageKeys.unread });
    },
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationKeys = {
  list: ["notifications"] as const,
  unread: ["notifications", "unread-count"] as const,
};

export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () =>
      api<ListNotificationsResponse>("/api/notifications", {
        query: { limit: 30 },
      }),
    enabled: options?.enabled ?? true,
    refetchInterval: 45000,
  });
}

export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () =>
      api<NotificationsUnreadResponse>("/api/notifications/unread-count"),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<{ ok: true }>("/api/notifications/read", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
      qc.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (body: {
      targetType: "post" | "comment" | "profile";
      targetId: string;
      category: string;
      details?: string;
    }) => api<{ ok: true }>("/api/reports", { method: "POST", body }),
  });
}
