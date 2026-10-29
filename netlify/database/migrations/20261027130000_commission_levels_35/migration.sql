ALTER TABLE "affiliate_commissions" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ALTER COLUMN "commission_rate_percent" SET DEFAULT 25;
--> statement-breakpoint
ALTER TABLE "affiliate_settings" ALTER COLUMN "commission_rate_percent" SET DEFAULT 35;
--> statement-breakpoint
ALTER TABLE "affiliate_settings" ALTER COLUMN "terms" SET DEFAULT 'Comissão total de 35% sobre pagamentos recorrentes elegíveis: 25% para quem indica diretamente (nível 1) e 10% distribuídos até o quarto nível da rede (5% no nível 2, 3% no nível 3 e 2% no nível 4). Resgate via chave PIX.';
--> statement-breakpoint
UPDATE "affiliate_settings" SET "commission_rate_percent" = 35, "terms" = 'Comissão total de 35% sobre pagamentos recorrentes elegíveis: 25% para quem indica diretamente (nível 1) e 10% distribuídos até o quarto nível da rede (5% no nível 2, 3% no nível 3 e 2% no nível 4). Resgate via chave PIX.';
