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
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" text DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_renewal_date" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pix_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pix_key_type" text DEFAULT 'cpf';--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ALTER COLUMN "commission_rate_percent" SET DEFAULT 60;--> statement-breakpoint
ALTER TABLE "affiliate_settings" ALTER COLUMN "commission_rate_percent" SET DEFAULT 60;--> statement-breakpoint
ALTER TABLE "affiliate_settings" ALTER COLUMN "min_payout_cents" SET DEFAULT 2394;--> statement-breakpoint
ALTER TABLE "affiliate_settings" ALTER COLUMN "terms" SET DEFAULT 'Comissão de 60% (R$ 23,94) sobre pagamentos recorrentes líquidos elegíveis de novos assinantes pagos indicados via link único. Resgate via chave PIX.';--> statement-breakpoint
ALTER TABLE "affiliate_withdrawals" ADD CONSTRAINT "affiliate_withdrawals_affiliate_user_id_users_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;