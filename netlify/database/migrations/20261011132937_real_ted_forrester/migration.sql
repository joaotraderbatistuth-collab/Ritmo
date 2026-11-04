CREATE TABLE "affiliate_commissions" (
	"id" serial PRIMARY KEY,
	"affiliate_user_id" integer NOT NULL,
	"referred_user_id" integer NOT NULL,
	"order_reference" text NOT NULL,
	"base_amount_cents" integer NOT NULL,
	"commission_rate_percent" integer DEFAULT 60 NOT NULL,
	"commission_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_reference" text,
	"payout_status" text DEFAULT 'manual' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_referrals" (
	"id" serial PRIMARY KEY,
	"affiliate_user_id" integer NOT NULL,
	"referred_user_id" integer,
	"referral_code" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"click_count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_settings" (
	"id" serial PRIMARY KEY,
	"commission_rate_percent" integer DEFAULT 60 NOT NULL,
	"attribution_window_days" integer DEFAULT 60 NOT NULL,
	"min_payout_cents" integer DEFAULT 2394 NOT NULL,
	"terms" text DEFAULT 'Comissão de 60% (R$ 23,94) sobre pagamentos recorrentes líquidos elegíveis de novos assinantes pagos indicados via link único. Resgate via chave PIX.' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_withdrawals" (
	"id" serial PRIMARY KEY,
	"affiliate_user_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"pix_key" text NOT NULL,
	"pix_key_type" text DEFAULT 'cpf' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"receipt_reference" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
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
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"discount_percent" integer DEFAULT 0,
	"discount_cents" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	"max_uses" integer DEFAULT 100 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_budgets" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"category" text NOT NULL,
	"month_year" text NOT NULL,
	"budget_limit_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"date" text NOT NULL,
	"category" text DEFAULT 'outros' NOT NULL,
	"payment_method" text DEFAULT 'pix',
	"account_wallet" text DEFAULT 'Principal' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_interval" text DEFAULT 'mensal',
	"is_installment" boolean DEFAULT false NOT NULL,
	"current_installment" integer DEFAULT 1,
	"total_installments" integer DEFAULT 1,
	"status" text DEFAULT 'paid' NOT NULL,
	"due_date" text,
	"notes" text DEFAULT '',
	"source" text DEFAULT 'web' NOT NULL,
	"synced_to_sheets" boolean DEFAULT false NOT NULL,
	"sheets_row_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_cycles" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"main_goal" text NOT NULL,
	"secondary_goals" text DEFAULT '[]',
	"duration_days" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"routine_level" text DEFAULT 'equilibrado' NOT NULL,
	"preferred_times" text DEFAULT '',
	"digital_limits" text DEFAULT '',
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"cycle_id" integer,
	"focus_topic" text DEFAULT '',
	"duration_minutes" integer NOT NULL,
	"session_type" text DEFAULT 'custom' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_logs" (
	"id" serial PRIMARY KEY,
	"habit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" text NOT NULL,
	"completed" boolean DEFAULT true NOT NULL,
	"value" text DEFAULT '',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"cycle_id" integer,
	"name" text NOT NULL,
	"category" text DEFAULT 'geral' NOT NULL,
	"target_frequency" text DEFAULT 'diario' NOT NULL,
	"notes" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations_config" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL UNIQUE,
	"whatsapp_phone" text,
	"whatsapp_status" text DEFAULT 'disconnected' NOT NULL,
	"sheets_status" text DEFAULT 'disconnected' NOT NULL,
	"sheets_spreadsheet_id" text,
	"sheets_spreadsheet_name" text DEFAULT 'Ritmo - Finanças Pessoais',
	"sheets_auto_sync" boolean DEFAULT true NOT NULL,
	"reminders_config" text DEFAULT '{"tasks":true,"habits":true,"financeDue":true,"weeklyReview":true}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"cycle_id" integer,
	"date" text NOT NULL,
	"entry_type" text DEFAULT 'daily_checkin' NOT NULL,
	"energy_score" integer DEFAULT 3,
	"mood_score" integer DEFAULT 3,
	"focus_score" integer DEFAULT 3,
	"worked_well" text DEFAULT '',
	"next_step" text DEFAULT '',
	"difficulties" text DEFAULT '',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL UNIQUE,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"order_reference" text NOT NULL UNIQUE,
	"amount_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"coupon_code" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text DEFAULT 'pix' NOT NULL,
	"paid_at" timestamp,
	"pix_qr_code" text,
	"pix_copia_e_cola" text,
	"invoice_url" text,
	"provider_payment_id" text,
	"is_simulated" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"plan" text DEFAULT 'pro_monthly' NOT NULL,
	"amount_cents" integer DEFAULT 3990 NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"provider" text DEFAULT 'pix_mercadopago' NOT NULL,
	"renewal_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"cycle_id" integer,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"category" text DEFAULT 'geral' NOT NULL,
	"priority" text DEFAULT 'media' NOT NULL,
	"date" text NOT NULL,
	"start_time" text DEFAULT '',
	"estimated_minutes" integer DEFAULT 30,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" text DEFAULT '',
	"time_block" text DEFAULT 'Manhã',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"subscription_status" text DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"subscription_renewal_date" text,
	"pix_key" text,
	"pix_key_type" text DEFAULT 'cpf',
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"theme_preference" text DEFAULT 'dark' NOT NULL,
	"referral_code" text NOT NULL UNIQUE,
	"referred_by" text,
	"whatsapp_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_user_id_users_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_referred_user_id_users_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_affiliate_user_id_users_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_referred_user_id_users_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "affiliate_withdrawals" ADD CONSTRAINT "affiliate_withdrawals_affiliate_user_id_users_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_card_comments" ADD CONSTRAINT "board_card_comments_card_id_board_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "board_cards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_card_comments" ADD CONSTRAINT "board_card_comments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_list_id_board_lists_id_fkey" FOREIGN KEY ("list_id") REFERENCES "board_lists"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_items_card_id_board_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "board_cards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_lists" ADD CONSTRAINT "board_lists_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "board_lists" ADD CONSTRAINT "board_lists_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "focus_cycles" ADD CONSTRAINT "focus_cycles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_cycle_id_focus_cycles_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "focus_cycles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_habits_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_cycle_id_focus_cycles_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "focus_cycles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "integrations_config" ADD CONSTRAINT "integrations_config_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_cycle_id_focus_cycles_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "focus_cycles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_cycle_id_focus_cycles_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "focus_cycles"("id") ON DELETE SET NULL;