CREATE TABLE "user_conversion" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sign_up_at" timestamp,
	"purchase_at" timestamp,
	"purchase_amount_cents" integer DEFAULT 0 NOT NULL,
	"gclid" text,
	"utm_source" text,
	"utm_campaign" text,
	"referrer" text,
	"landing_page" text,
	"pending_purchase_reports" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_conversion_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "user_conversion" ADD CONSTRAINT "user_conversion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_conversion_user_id_idx" ON "user_conversion" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_conversion_sign_up_at_idx" ON "user_conversion" USING btree ("sign_up_at");--> statement-breakpoint
CREATE INDEX "user_conversion_purchase_at_idx" ON "user_conversion" USING btree ("purchase_at");--> statement-breakpoint
CREATE INDEX "user_conversion_gclid_idx" ON "user_conversion" USING btree ("gclid");--> statement-breakpoint
CREATE INDEX "user_conversion_utm_source_idx" ON "user_conversion" USING btree ("utm_source");--> statement-breakpoint
CREATE INDEX "user_conversion_landing_page_idx" ON "user_conversion" USING btree ("landing_page");