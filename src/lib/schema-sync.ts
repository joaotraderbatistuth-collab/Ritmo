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

import { seedRitusStatements } from './ritus-seed.js';

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

  // ---- fotos no Feed, comprovantes de Pix, convites de admin e notificações (atualização de 05/11/2026)
  `ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "image_url" text`,
  `ALTER TABLE "feed_comments" ADD COLUMN IF NOT EXISTS "image_url" text`,
  `ALTER TABLE "affiliate_withdrawals" ADD COLUMN IF NOT EXISTS "receipt_url" text`,
  `CREATE TABLE IF NOT EXISTS "media" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" text NOT NULL UNIQUE,
    "owner_user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
    "purpose" text DEFAULT 'feed' NOT NULL,
    "mime" text NOT NULL,
    "data" text NOT NULL,
    "size_bytes" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "media_owner_created_idx" ON "media" ("owner_user_id","created_at")`,
  `CREATE TABLE IF NOT EXISTS "admin_invites" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "permissions" text,
    "invited_by" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "endpoint" text NOT NULL UNIQUE,
    "p256dh" text NOT NULL,
    "auth" text NOT NULL,
    "per_day" integer DEFAULT 3 NOT NULL,
    "last_sent_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "app_settings" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,

  // ---- Pontos de Ritmo (XP), níveis e foto de perfil com moldura (atualização de 05/11/2026)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp_total" integer NOT NULL DEFAULT 0`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "level" integer NOT NULL DEFAULT 1`,
  // ---- bio do perfil público
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text`,

  // ---- treinos com GPS (aba Treino)
  `CREATE TABLE IF NOT EXISTS "workouts" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "sport" text NOT NULL,
    "title" text NOT NULL,
    "notes" text DEFAULT '' NOT NULL,
    "started_at" timestamp NOT NULL,
    "moving_s" integer NOT NULL,
    "elapsed_s" integer NOT NULL,
    "distance_m" integer NOT NULL,
    "elevation_gain_m" integer,
    "route" text DEFAULT '' NOT NULL,
    "splits" text DEFAULT '[]' NOT NULL,
    "source" text DEFAULT 'gps' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "workouts_user_started_idx" ON "workouts" ("user_id","started_at")`,

  // ---- secretário: nome e lembretes
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assistant_name" text`,
  `CREATE TABLE IF NOT EXISTS "reminders" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "text" text NOT NULL,
    "remind_at" timestamp NOT NULL,
    "task_id" integer,
    "sent_at" timestamp,
    "done_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "reminders_due_idx" ON "reminders" ("sent_at","remind_at")`,
  `CREATE INDEX IF NOT EXISTS "reminders_user_idx" ON "reminders" ("user_id","remind_at")`,
  `ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "repeat" text`,

  // ---- consentimentos (LGPD)
  `CREATE TABLE IF NOT EXISTS "consents" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "kind" text NOT NULL,
    "version" text NOT NULL,
    "granted_at" timestamp DEFAULT now() NOT NULL,
    "revoked_at" timestamp
  )`,
  `CREATE INDEX IF NOT EXISTS "consents_user_idx" ON "consents" ("user_id","kind")`,

  // ---- painel de números: origem do cadastro e dias de uso
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signup_source" text`,
  `CREATE TABLE IF NOT EXISTS "user_activity" (
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "day" text NOT NULL,
    PRIMARY KEY ("user_id", "day")
  )`,
  `CREATE INDEX IF NOT EXISTS "user_activity_day_idx" ON "user_activity" ("day")`,

  // ---- alerta de erros
  `CREATE TABLE IF NOT EXISTS "error_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "fingerprint" text NOT NULL,
    "source" text NOT NULL,
    "message" text NOT NULL,
    "stack" text DEFAULT '' NOT NULL,
    "url" text DEFAULT '' NOT NULL,
    "user_agent" text DEFAULT '' NOT NULL,
    "user_id" integer,
    "count" integer DEFAULT 1 NOT NULL,
    "first_seen" timestamp DEFAULT now() NOT NULL,
    "last_seen" timestamp DEFAULT now() NOT NULL,
    "resolved_at" timestamp,
    "notified_at" timestamp
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "error_logs_fingerprint_idx" ON "error_logs" ("fingerprint")`,

  // ---- missões, baú, ofensiva e ligas
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "league_tier" integer NOT NULL DEFAULT 0`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "league_opt_out" boolean NOT NULL DEFAULT false`,
  `CREATE TABLE IF NOT EXISTS "mission_days" (
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "day" text NOT NULL,
    "reward" text NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "opened_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("user_id", "day")
  )`,
  `CREATE TABLE IF NOT EXISTS "league_weeks" (
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "week" text NOT NULL,
    "tier" integer NOT NULL,
    "group_no" integer NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("user_id", "week")
  )`,
  `CREATE INDEX IF NOT EXISTS "league_weeks_group_idx" ON "league_weeks" ("week", "tier", "group_no")`,

  // ---- seguir pessoas no Feed
  `CREATE TABLE IF NOT EXISTS "follows" (
    "follower_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "followee_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("follower_id", "followee_id")
  )`,
  `CREATE INDEX IF NOT EXISTS "follows_followee_idx" ON "follows" ("followee_id")`,
  // notificações ligadas por padrão: true só quando a pessoa desliga de propósito
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_opt_out" boolean NOT NULL DEFAULT false`,

  // ---- pesquisa de perfil (gostos, renda, esportes, música...) feita depois do cadastro
  `CREATE TABLE IF NOT EXISTS "profile_surveys" (
    "user_id" integer PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "answers" text DEFAULT '{}' NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "completed_at" timestamp,
    "dismissed_at" timestamp,
    "dismiss_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,

  // ---- horários das notificações escolhidos pela pessoa
  `ALTER TABLE "push_subscriptions" ADD COLUMN IF NOT EXISTS "hours" text`,

  // ---- temporada mensal (divisões com promoção e rebaixamento)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "season_tier" integer NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS "season_months" (
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "month" text NOT NULL,
    "tier" integer NOT NULL,
    "group_no" integer NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "came_from" text DEFAULT 'new' NOT NULL,
    "prev_rank" integer,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("user_id", "month")
  )`,
  `CREATE INDEX IF NOT EXISTS "season_months_group_idx" ON "season_months" ("month", "tier", "group_no")`,

  // ---- desafios em dupla ou trio
  `CREATE TABLE IF NOT EXISTS "challenges" (
    "id" serial PRIMARY KEY,
    "code" text NOT NULL UNIQUE,
    "creator_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "kind" text NOT NULL,
    "target" integer NOT NULL,
    "days" integer NOT NULL,
    "start_day" text NOT NULL,
    "end_day" text NOT NULL,
    "title" text DEFAULT '' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "challenge_members" (
    "challenge_id" integer NOT NULL REFERENCES "challenges"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'invited' NOT NULL,
    "joined_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("challenge_id", "user_id")
  )`,
  `CREATE INDEX IF NOT EXISTS "challenge_members_user_idx" ON "challenge_members" ("user_id")`,

  // ---- teto de notificações automáticas por dia
  `CREATE TABLE IF NOT EXISTS "push_log" (
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "day" text NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "kinds" text DEFAULT '' NOT NULL,
    PRIMARY KEY ("user_id", "day")
  )`,

  // ---- preenchimento automático: um compromisso preenche Quadros, Finanças e lembretes
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autofill" boolean NOT NULL DEFAULT true`,
  `CREATE TABLE IF NOT EXISTS "item_links" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "grp" text NOT NULL,
    "kind" text NOT NULL,
    "item_id" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "item_links_item_idx" ON "item_links" ("user_id", "kind", "item_id")`,
  `CREATE INDEX IF NOT EXISTS "item_links_grp_idx" ON "item_links" ("user_id", "grp")`,

  // ---- compartilhar conquistas (Stories, WhatsApp): cada imagem tem um link público com o convite da pessoa
  `CREATE TABLE IF NOT EXISTS "share_cards" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "slug" text NOT NULL UNIQUE,
    "kind" text NOT NULL,
    "emoji" text NOT NULL DEFAULT '',
    "title" text NOT NULL,
    "subtitle" text NOT NULL DEFAULT '',
    "image" text,
    "views" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "share_cards_user_idx" ON "share_cards" ("user_id", "created_at")`,

  // ---- jogo: pontos da semana (ranking entre amigos), baú semanal e stories dentro do app
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "week_key" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "week_xp" integer NOT NULL DEFAULT 0`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "story_auto" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "social_seen_at" timestamp`,
  `CREATE TABLE IF NOT EXISTS "week_chests" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "week" text NOT NULL,
    "day" text NOT NULL,
    "xp" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "week_chests_user_week" ON "week_chests" ("user_id", "week")`,
  `CREATE TABLE IF NOT EXISTS "stories" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "kind" text NOT NULL,
    "emoji" text NOT NULL DEFAULT '',
    "tag" text NOT NULL DEFAULT '',
    "title" text NOT NULL,
    "subtitle" text NOT NULL DEFAULT '',
    "big" text,
    "big_label" text,
    "color" text NOT NULL DEFAULT '#34d399',
    "live" boolean NOT NULL DEFAULT false,
    "auto" boolean NOT NULL DEFAULT false,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "stories_user_idx" ON "stories" ("user_id", "expires_at")`,
  `CREATE INDEX IF NOT EXISTS "stories_exp_idx" ON "stories" ("expires_at")`,
  `CREATE TABLE IF NOT EXISTS "story_views" (
    "story_id" integer NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "clapped" boolean NOT NULL DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("story_id", "user_id")
  )`,

  // ---- stories com foto (e escondidos pela moderação)
  `ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "image_url" text`,
  `ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "hidden" boolean NOT NULL DEFAULT false`,

  // ---- lista de espera (limite de contas da fase de lançamento; limite em app_settings 'max_accounts')
  `CREATE TABLE IF NOT EXISTS "waitlist" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL DEFAULT '',
    "email" text NOT NULL UNIQUE,
    "source" text,
    "notified_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,

  // ---- Fundadores: os 50 primeiros usuários comuns têm acesso vitalício (coluna + marcação única das contas que já existem)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "founder" boolean NOT NULL DEFAULT false`,
  `UPDATE "users" SET "founder" = true, "updated_at" = now()
   WHERE "id" IN (SELECT "id" FROM "users" WHERE "role" <> 'admin' ORDER BY "created_at", "id" LIMIT 50)
     AND NOT EXISTS (SELECT 1 FROM "admin_audit_log" WHERE "action" = 'founders_v1')`,
  `INSERT INTO "admin_audit_log" ("admin_email","action","details")
   SELECT 'sistema','founders_v1','Contas já existentes marcadas como Fundadoras (acesso vitalício)'
   WHERE NOT EXISTS (SELECT 1 FROM "admin_audit_log" WHERE "action" = 'founders_v1')`,

  // ---- horas em que o banco foi usado (aba "Créditos" do painel; 1 linha por hora UTC, ex.: 2026-11-10T14)
  `CREATE TABLE IF NOT EXISTS "db_hours" (
    "hour" text PRIMARY KEY,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,

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

  // ---- 10 Ritus gratuitos iniciais (Clube do Livro e outros), uma única vez
  ...seedRitusStatements(MASTER_EMAIL),
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
