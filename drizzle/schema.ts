import { relations } from "drizzle-orm";
import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const agentAccounts = mysqlTable("agentAccounts", {
  id: int("id").autoincrement().primaryKey(),
  accountRole: mysqlEnum("accountRole", ["agent", "admin"]).default("agent").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  roleTitle: varchar("roleTitle", { length: 180 }).default("").notNull(),
  bio: text("bio"),
  photoUrl: varchar("photoUrl", { length: 512 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isFeaturedOnHomepage: boolean("isFeaturedOnHomepage").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  managedByAdmin: boolean("managedByAdmin").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  siteName: varchar("siteName", { length: 160 }).default("Team Shay").notNull(),
  headerLogoUrl: varchar("headerLogoUrl", { length: 512 }),
  footerLogoUrl: varchar("footerLogoUrl", { length: 512 }),
  landsmanLogoUrl: varchar("landsmanLogoUrl", { length: 512 }),
  heroBackgroundUrl: varchar("heroBackgroundUrl", { length: 512 }),
  shayAboutImageUrl: varchar("shayAboutImageUrl", { length: 512 }),
  heroHeadline: text("heroHeadline"),
  heroTypingText: text("heroTypingText"),
  whatsappLink: varchar("whatsappLink", { length: 512 }),
  officePhone: varchar("officePhone", { length: 32 }),
  aboutTitle: varchar("aboutTitle", { length: 180 }),
  aboutSubtitle: text("aboutSubtitle"),
  landsmanTitle: varchar("landsmanTitle", { length: 180 }),
  landsmanBody: text("landsmanBody"),
  footerSlogan: varchar("footerSlogan", { length: 180 }).default("מתווכים בצד שלך").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  quote: text("quote").notNull(),
  sourceName: varchar("sourceName", { length: 180 }).notNull(),
  sourceLabel: varchar("sourceLabel", { length: 180 }).default("WhatsApp").notNull(),
  stars: int("stars").default(5).notNull(),
  whatsappImageUrl: varchar("whatsappImageUrl", { length: 512 }),
  legacySortOrder: int("sortOrder").default(0).notNull(),
  displayOrder: int("displayOrder").default(1).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leadSubmissions = mysqlTable("leadSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 120 }).notNull(),
  rooms: int("rooms").notNull(),
  sqm: int("sqm").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId")
    .notNull()
    .references(() => agentAccounts.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  street: varchar("street", { length: 180 }),
  neighborhood: varchar("neighborhood", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).default("ירושלים").notNull(),
  price: int("price").notNull(),
  rooms: int("rooms").notNull(),
  sqm: int("sqm").notNull(),
  builtSqm: int("builtSqm"),
  outdoorSpace: varchar("outdoorSpace", { length: 120 }),
  floor: int("floor"),
  status: mysqlEnum("status", ["חדש", "בלעדי", "למכירה", "נמכר"]).default("חדש").notNull(),
  description: text("description").notNull(),
  descriptionHtml: text("descriptionHtml"),
  featuredImageUrl: varchar("featuredImageUrl", { length: 512 }),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const propertyImages = mysqlTable("propertyImages", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  imageUrl: varchar("imageUrl", { length: 512 }).notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  altText: varchar("altText", { length: 255 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, () => ({}));

export const agentAccountsRelations = relations(agentAccounts, ({ many }) => ({
  properties: many(properties),
}));

export const siteSettingsRelations = relations(siteSettings, () => ({}));

export const testimonialsRelations = relations(testimonials, () => ({}));

export const leadSubmissionsRelations = relations(leadSubmissions, () => ({}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(agentAccounts, {
    fields: [properties.agentId],
    references: [agentAccounts.id],
  }),
  images: many(propertyImages),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type AgentAccount = typeof agentAccounts.$inferSelect;
export type InsertAgentAccount = typeof agentAccounts.$inferInsert;

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export type LeadSubmission = typeof leadSubmissions.$inferSelect;
export type InsertLeadSubmission = typeof leadSubmissions.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;
