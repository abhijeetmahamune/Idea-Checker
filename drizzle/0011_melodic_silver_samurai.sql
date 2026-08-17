ALTER TABLE "devil_advocate_reports" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "devil_advocate_reports" ADD COLUMN "solution_content_snapshot" text;--> statement-breakpoint
ALTER TABLE "devil_advocate_reports" ADD COLUMN "previous_report_id" uuid;--> statement-breakpoint
ALTER TABLE "devil_advocate_reports" ADD COLUMN "evolution_summary" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "clarification_questions" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "founder_clarifications" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "evaluation_type" text;