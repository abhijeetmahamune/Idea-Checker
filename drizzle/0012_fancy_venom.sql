ALTER TABLE "problems" ADD COLUMN "stage" text DEFAULT 'EXPLORING' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "seeking" text[] DEFAULT '{}' NOT NULL;