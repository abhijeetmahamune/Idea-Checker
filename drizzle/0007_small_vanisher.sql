CREATE TABLE "ai_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"endpoint" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text,
	"latency" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"estimated_cost" numeric(10, 6),
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solution_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"file_type" text,
	"file_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deep_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solution_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"model_used" text,
	"prompt_version" text,
	"generation_time_ms" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"estimated_cost" numeric(10, 6),
	"content" jsonb,
	"error_message" text,
	"content_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "raw_responses" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "consensus_result" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "model_used" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "prompt_version" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "generation_time_ms" integer;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "prompt_tokens" integer;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "completion_tokens" integer;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "total_tokens" integer;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "estimated_cost" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "content_hash" text;--> statement-breakpoint
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deep_reports" ADD CONSTRAINT "deep_reports_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;