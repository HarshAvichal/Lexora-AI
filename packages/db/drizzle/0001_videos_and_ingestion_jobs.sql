CREATE TYPE "public"."ingestion_job_status" AS ENUM('queued', 'resolving', 'fetching_transcript', 'chunking', 'embedding', 'indexing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ingestion_job_type" AS ENUM('ingest_video', 'reindex', 'playlist_batch');--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"youtube_video_id" text NOT NULL,
	"title" text,
	"channel_title" text,
	"duration_seconds" integer,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"type" "ingestion_job_type" NOT NULL,
	"status" "ingestion_job_status" NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"error_message" text,
	"error_code" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"payload" jsonb,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "videos_owner_youtube_uidx" ON "videos" USING btree ("owner_user_id","youtube_video_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_jobs_owner_idempotency_uidx" ON "ingestion_jobs" USING btree ("owner_user_id","idempotency_key");