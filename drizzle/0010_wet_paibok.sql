ALTER TABLE "evaluations" ADD COLUMN "contested_dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "dimension_spread" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "bottleneck" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "consensus_summary" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "trust_level" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "trust_label" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "ranked_strengths" jsonb;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "ranked_weaknesses" jsonb;