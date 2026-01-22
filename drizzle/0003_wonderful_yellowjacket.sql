CREATE TABLE "credit_package" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credit_amount" integer NOT NULL,
	"expire_days" integer,
	"price_amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"stripe_price_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
