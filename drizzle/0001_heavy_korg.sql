CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_track_user_unique" UNIQUE("track_id","user_id")
);
