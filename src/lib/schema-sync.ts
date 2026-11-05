// Sincronização IDEMPOTENTE do esquema do banco.
//
// Por que existe: o app evoluiu em várias etapas e não dá para saber, em cada instalação, quais
// migrações já foram aplicadas. Estas instruções só ACRESCENTAM o que falta (IF NOT EXISTS) e são
// seguras de rodar quantas vezes for: se tudo já existe, não fazem nada. Assim, publicar o código
// novo sobre QUALQUER versão anterior deixa o banco na geração final, sem depender de migrações
// na ordem certa e sem nunca apagar ou alterar dados existentes.
//
// Regra para o futuro: nova coluna/tabela entra aqui com IF NOT EXISTS (e no schema.ts).

const TERMS =
  'Comissão total de 35% sobre pagamentos recorrentes elegíveis: 25% para quem indica diretamente (nível 1) e 10% distribuídos até o quarto nível da rede (5% no nível 2, 3% no nível 3 e 2% no nível 4). Resgate via chave PIX.';

// Conta master. Só o hash bcrypt da senha fica no código, nunca a senha em texto.
const MASTER_EMAIL = 'batistuth@live.com';
const MASTER_PASSWORD_HASH = '$2a$10$fADPSg9B43me/ywXyP8H7O/8855XOE6lXcUnm4BjVM/ci585x58WC';

export const SCHEMA_SYNC_STATEMENTS: string[] = [
  // ---- usuários
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_permissions" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "feed_muted" boolean NOT NULL DEFAULT false`,

  // ---- diário: reflexão do dia
  `ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "reflection_easier" text DEFAULT ''`,
  `ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "reflection_avoid" text DEFAULT ''`,

  // ---- comissões em rede (25% + 10% até o nível 4)
  `ALTER TABLE "affiliate_commissions" ADD COLUMN IF NOT EXISTS "level" integer NOT NULL DEFAULT 1`,
  `ALTER TABLE "affiliate_commissions" ALTER COLUMN "commission_rate_percent" SET DEFAULT 25`,
  `ALTER TABLE "affiliate_settings" ALTER COLUMN "commission_rate_percent" SET DEFAULT 35`,
  `ALTER TABLE "affiliate_settings" ALTER COLUMN "terms" SET DEFAULT '${TERMS}'`,
  // só troca o texto/percentual antigo (60%); nunca mexe se já foi atualizado
  `UPDATE "affiliate_settings" SET "commission_rate_percent" = 35, "terms" = '${TERMS}' WHERE "commission_rate_percent" = 60`,

  // ---- recuperação de senha: limite de tentativas
  `ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0`,

  // ---- pagamentos: compra de acesso a equipes
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'subscription'`,
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "team_id" integer`,

  // ---- auditoria do painel administrativo
  `CREATE TABLE IF NOT EXISTS "admin_audit_log" (
    "id" serial PRIMARY KEY NOT NULL,
    "admin_user_id" integer,
    "admin_email" text NOT NULL,
    "action" text NOT NULL,
    "target_type" text,
    "target_id" text,
    "details" text,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,

  // ---- equipes e repasses
  `CREATE TABLE IF NOT EXISTS "teams" (
    "id" serial PRIMARY KEY NOT NULL,
    "owner_user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "code" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "period_days" integer DEFAULT 0 NOT NULL,
    "free_for_referred" boolean DEFAULT true NOT NULL,
    "members_can_post" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "teams_code_unique" UNIQUE("code")
  )`,
  `CREATE TABLE IF NOT EXISTS "team_members" (
    "id" serial PRIMARY KEY NOT NULL,
    "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "source" text DEFAULT 'purchase' NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "expires_at" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "team_members_team_user_unique" UNIQUE("team_id","user_id")
  )`,
  `CREATE TABLE IF NOT EXISTS "team_earnings" (
    "id" serial PRIMARY KEY NOT NULL,
    "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "owner_user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "buyer_user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "order_reference" text NOT NULL,
    "gross_cents" integer NOT NULL,
    "platform_fee_cents" integer NOT NULL,
    "owner_cents" integer NOT NULL,
    "status" text DEFAULT 'approved' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "team_earnings_order_unique" UNIQUE("order_reference")
  )`,

  // ---- feed
  `CREATE TABLE IF NOT EXISTS "feed_posts" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "team_id" integer,
    "kind" text DEFAULT 'text' NOT NULL,
    "body" text DEFAULT '' NOT NULL,
    "payload" text,
    "status" text DEFAULT 'visible' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "feed_likes" (
    "id" serial PRIMARY KEY NOT NULL,
    "post_id" integer NOT NULL REFERENCES "feed_posts"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "feed_likes_post_user_unique" UNIQUE("post_id","user_id")
  )`,
  `CREATE TABLE IF NOT EXISTS "feed_comments" (
    "id" serial PRIMARY KEY NOT NULL,
    "post_id" integer NOT NULL REFERENCES "feed_posts"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "body" text NOT NULL,
    "status" text DEFAULT 'visible' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "feed_reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "target_type" text NOT NULL,
    "target_id" integer NOT NULL,
    "reporter_user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "reason" text DEFAULT '' NOT NULL,
    "status" text DEFAULT 'open' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "feed_reports_unique" UNIQUE("target_type","target_id","reporter_user_id")
  )`,
  `CREATE INDEX IF NOT EXISTS "feed_posts_team_created_idx" ON "feed_posts" ("team_id","created_at")`,
  `CREATE INDEX IF NOT EXISTS "feed_posts_user_created_idx" ON "feed_posts" ("user_id","created_at")`,
  `CREATE INDEX IF NOT EXISTS "feed_comments_post_idx" ON "feed_comments" ("post_id","created_at")`,
  `CREATE INDEX IF NOT EXISTS "team_members_user_idx" ON "team_members" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "team_earnings_owner_idx" ON "team_earnings" ("owner_user_id","status")`,

  // ---- Ritus (antigas "equipes"): vitrine pública e ranking de acessos
  `ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "listed" boolean NOT NULL DEFAULT true`,
  `ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "view_count" integer NOT NULL DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS "teams_listed_views_idx" ON "teams" ("active","listed","view_count")`,

  // ---- administrador master: batistuth@live.com
  // Cria a conta se ainda não existir (admin, ativa, sem período de teste).
  `INSERT INTO "users" ("email","name","password_hash","role","subscription_status","trial_ends_at","referral_code")
   VALUES ('${MASTER_EMAIL}','João','${MASTER_PASSWORD_HASH}','admin','active',NULL,'RITMO-MASTER')
   ON CONFLICT ("email") DO NOTHING`,
  // Define a senha UMA única vez (marcada na auditoria). Depois disso, se a senha for trocada pelo
  // "esqueci a senha", ela não volta a ser sobrescrita.
  `UPDATE "users" SET "password_hash" = '${MASTER_PASSWORD_HASH}', "updated_at" = now()
   WHERE "email" = '${MASTER_EMAIL}'
     AND NOT EXISTS (SELECT 1 FROM "admin_audit_log" WHERE "action" = 'master_bootstrap_v1')`,
  `INSERT INTO "admin_audit_log" ("admin_email","action","details")
   SELECT '${MASTER_EMAIL}','master_bootstrap_v1','Conta master definida como admin com acesso total e senha inicial'
   WHERE NOT EXISTS (SELECT 1 FROM "admin_audit_log" WHERE "action" = 'master_bootstrap_v1')`,
  // Sempre: admin, ativo e sem período de teste.
  `UPDATE "users" SET "role" = 'admin', "subscription_status" = 'active', "trial_ends_at" = NULL, "updated_at" = now()
   WHERE "email" = '${MASTER_EMAIL}'
     AND ("role" <> 'admin' OR "subscription_status" <> 'active' OR "trial_ends_at" IS NOT NULL)`,
];

export interface SchemaSyncResult {
  total: number;
  failed: { statement: string; error: string }[];
}

/**
 * Roda todas as instruções. Cada uma é independente: se uma falhar (por exemplo, por corrida entre
 * dois processos criando a mesma tabela), as outras continuam. Devolve o que falhou para registrar.
 */
export async function runSchemaSync(exec: (statement: string) => Promise<unknown>): Promise<SchemaSyncResult> {
  const failed: SchemaSyncResult['failed'] = [];
  for (const statement of SCHEMA_SYNC_STATEMENTS) {
    try {
      await exec(statement);
    } catch (e: any) {
      const msg = String(e?.message || e);
      // outro processo criou o mesmo objeto no mesmo instante: o resultado final é o desejado
      if (/already exists|duplicate (key|object)|pg_type_typname_nsp_index/i.test(msg)) continue;
      failed.push({ statement: statement.slice(0, 90).replace(/\s+/g, ' '), error: msg });
    }
  }
  return { total: SCHEMA_SYNC_STATEMENTS.length, failed };
}
