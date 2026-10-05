CREATE TABLE "board_card_comments" (
	"id" serial PRIMARY KEY,
	"card_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_cards" (
	"id" serial PRIMARY KEY,
	"list_id" integer NOT NULL,
	"board_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"priority" text DEFAULT 'media' NOT NULL,
	"labels" text DEFAULT '[]',
	"assignee" text DEFAULT '',
	"due_date" text,
	"position" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_checklist_items" (
	"id" serial PRIMARY KEY,
	"card_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"text" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_lists" (
	"id" serial PRIMARY KEY,
	"board_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"color" text DEFAULT 'emerald' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_card_comments" ADD CONSTRAINT "board_card_comments_card_id_board_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "board_cards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_card_comments" ADD CONSTRAINT "board_card_comments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_list_id_board_lists_id_fkey" FOREIGN KEY ("list_id") REFERENCES "board_lists"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_items_card_id_board_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "board_cards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_lists" ADD CONSTRAINT "board_lists_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_lists" ADD CONSTRAINT "board_lists_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;