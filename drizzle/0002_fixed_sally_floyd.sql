CREATE TYPE "public"."attachment_kind" AS ENUM('image', 'file');--> statement-breakpoint
CREATE TYPE "public"."attachment_owner" AS ENUM('message', 'post', 'comment');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "attachment_owner" NOT NULL,
	"owner_id" uuid NOT NULL,
	"uploader_id" uuid NOT NULL,
	"kind" "attachment_kind" NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_owner_idx" ON "attachments" USING btree ("owner_type","owner_id");