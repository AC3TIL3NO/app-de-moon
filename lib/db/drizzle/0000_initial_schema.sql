DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'RECEPTIONIST', 'INSTRUCTOR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#7C3AED' NOT NULL,
	"secondary_color" text DEFAULT '#A78BFA' NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"cancellation_policy" text,
	"payment_methods" text DEFAULT '[\"Efectivo\",\"Yappy\",\"Visa\",\"Mastercard\",\"PayPal\",\"PagueloFacil\",\"Transferencia\"]',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'ADMIN' NOT NULL,
	"studio_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"specialties" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"instructor_id" integer NOT NULL,
	"time" text NOT NULL,
	"duration" integer NOT NULL,
	"capacity" integer NOT NULL,
	"enrolled" integer DEFAULT 0 NOT NULL,
	"level" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'Activa' NOT NULL,
	"day_of_week" text NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"plan" text NOT NULL,
	"classes_remaining" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"password_hash" text,
	"clerk_user_id" text,
	"policies_accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "clients_phone_nonempty_unique" ON "clients" USING btree ("phone") WHERE phone != '';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_classes" integer NOT NULL,
	"price" integer NOT NULL,
	"promo_price" integer,
	"duration_days" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'Confirmada' NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"membership_id" integer NOT NULL,
	"membership_name" text NOT NULL,
	"client_name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"classes_used" integer DEFAULT 0 NOT NULL,
	"classes_total" integer NOT NULL,
	"status" text DEFAULT 'Activa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"membership_id" integer,
	"reservation_id" integer,
	"concept" text DEFAULT 'Membresía' NOT NULL,
	"amount" real NOT NULL,
	"payment_method" text DEFAULT 'Stripe' NOT NULL,
	"card_brand" text,
	"card_last4" text,
	"charged_by" text DEFAULT 'Sistema' NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "client_memberships" ADD CONSTRAINT "client_memberships_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "client_memberships" ADD CONSTRAINT "client_memberships_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;
