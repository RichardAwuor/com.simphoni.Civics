CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"county" text NOT NULL,
	"constituency" text NOT NULL,
	"ward" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"national_id_hash" text NOT NULL,
	"civic_code" text NOT NULL,
	"biometric_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "agents_email_unique" UNIQUE("email"),
	CONSTRAINT "agents_civic_code_unique" UNIQUE("civic_code")
);
--> statement-breakpoint
CREATE TABLE "candidate_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form34a_id" uuid NOT NULL,
	"candidate_first_name" text NOT NULL,
	"candidate_last_name" text NOT NULL,
	"party_name" text NOT NULL,
	"votes" integer NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form34a_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"serial_number" text NOT NULL,
	"image_url" text NOT NULL,
	"image_key" text NOT NULL,
	"county" text NOT NULL,
	"constituency" text NOT NULL,
	"ward" text NOT NULL,
	"polling_station" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"has_discrepancy" boolean DEFAULT false NOT NULL,
	CONSTRAINT "form34a_submissions_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "incident_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"video_url" text NOT NULL,
	"video_code" text NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"location_name" text,
	"duration" integer,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polling_stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"county" text NOT NULL,
	"constituency" text NOT NULL,
	"ward" text NOT NULL,
	"station_name" text NOT NULL,
	"station_code" text NOT NULL,
	"expected_agents" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "polling_stations_station_code_unique" UNIQUE("station_code")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_results" ADD CONSTRAINT "candidate_results_form34a_id_form34a_submissions_id_fk" FOREIGN KEY ("form34a_id") REFERENCES "public"."form34a_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form34a_submissions" ADD CONSTRAINT "form34a_submissions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_videos" ADD CONSTRAINT "incident_videos_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_email_idx" ON "agents" USING btree ("email");--> statement-breakpoint
CREATE INDEX "agents_civic_code_idx" ON "agents" USING btree ("civic_code");--> statement-breakpoint
CREATE INDEX "agents_user_id_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_county_idx" ON "agents" USING btree ("county");--> statement-breakpoint
CREATE INDEX "candidate_results_form34a_id_idx" ON "candidate_results" USING btree ("form34a_id");--> statement-breakpoint
CREATE INDEX "form34a_agent_id_idx" ON "form34a_submissions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "form34a_serial_number_idx" ON "form34a_submissions" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "form34a_county_idx" ON "form34a_submissions" USING btree ("county");--> statement-breakpoint
CREATE INDEX "form34a_constituency_idx" ON "form34a_submissions" USING btree ("constituency");--> statement-breakpoint
CREATE INDEX "form34a_ward_idx" ON "form34a_submissions" USING btree ("ward");--> statement-breakpoint
CREATE INDEX "form34a_polling_station_idx" ON "form34a_submissions" USING btree ("polling_station");--> statement-breakpoint
CREATE INDEX "incident_videos_agent_id_idx" ON "incident_videos" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "incident_videos_video_code_idx" ON "incident_videos" USING btree ("video_code");--> statement-breakpoint
CREATE INDEX "polling_stations_county_idx" ON "polling_stations" USING btree ("county");--> statement-breakpoint
CREATE INDEX "polling_stations_constituency_idx" ON "polling_stations" USING btree ("constituency");--> statement-breakpoint
CREATE INDEX "polling_stations_ward_idx" ON "polling_stations" USING btree ("ward");--> statement-breakpoint
CREATE INDEX "polling_stations_station_code_idx" ON "polling_stations" USING btree ("station_code");