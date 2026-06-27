import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: text("track_id").notNull(),
  userId: text("user_id").notNull(),
  rating: text("rating").notNull(), // "up" | "down"
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("ratings_track_user_unique").on(t.trackId, t.userId),
]);
