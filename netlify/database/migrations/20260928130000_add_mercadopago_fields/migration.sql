ALTER TABLE "payments" ADD COLUMN "provider_payment_id" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "is_simulated" boolean DEFAULT true NOT NULL;
