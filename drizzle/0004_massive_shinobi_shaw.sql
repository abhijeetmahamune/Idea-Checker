CREATE TABLE "devil_advocate_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solution_id" uuid NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "domain" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "pivot_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "devil_advocate_reports" ADD CONSTRAINT "devil_advocate_reports_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;