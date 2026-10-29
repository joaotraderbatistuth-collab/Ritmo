CREATE TABLE "cycle_milestones" (
	"id" serial PRIMARY KEY,
	"cycle_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"target_day" integer NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cycle_milestones" ADD CONSTRAINT "cycle_milestones_cycle_id_focus_cycles_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "focus_cycles"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "cycle_milestones" ADD CONSTRAINT "cycle_milestones_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
