import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  decimal,
  date,
  varchar,
  jsonb
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table des utilisateurs (agents/admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  nom: varchar("nom", { length: 100 }).notNull(),
  prenom: varchar("prenom", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("agent"), // admin, superviseur, agent
  actif: boolean("actif").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table des clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  prenom: varchar("prenom", { length: 100 }).notNull(),
  dateNaissance: date("date_naissance").notNull(),
  numeroSecu: varchar("numero_secu", { length: 15 }).notNull(),
  telephone: varchar("telephone", { length: 20 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  adresse: text("adresse").notNull(),
  situationFamiliale: varchar("situation_familiale", { length: 20 }).notNull(),
  nombreAyantsDroit: integer("nombre_ayants_droit").default(0),
  mutuelleActuelle: varchar("mutuelle_actuelle", { length: 100 }),
  niveauCouverture: varchar("niveau_couverture", { length: 50 }),
  statut: varchar("statut", { length: 20 }).notNull().default("nouveau"), // nouveau, prospect, client, perdu
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Table des devis
export const devis = pgTable("devis", {
  id: serial("id").primaryKey(),
  numeroDevis: varchar("numero_devis", { length: 50 }).notNull().unique(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  typeDevis: varchar("type_devis", { length: 50 }).notNull(),
  montantMensuel: decimal("montant_mensuel", { precision: 10, scale: 2 }).notNull(),
  garanties: jsonb("garanties"),
  statut: varchar("statut", { length: 20 }).notNull().default("brouillon"), // brouillon, envoye, accepte, refuse
  dateValidite: date("date_validite").notNull(),
  observations: text("observations"),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Table des documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 200 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // piece_identite, attestation_secu, contrat, autre
  taille: integer("taille").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  cheminFichier: text("chemin_fichier").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  devisId: integer("devis_id").references(() => devis.id),
  createdAt: timestamp("created_at").defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

// Table des rappels
export const rappels = pgTable("rappels", {
  id: serial("id").primaryKey(),
  titre: varchar("titre", { length: 200 }).notNull(),
  description: text("description"),
  dateRappel: timestamp("date_rappel").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // appel, relance, rdv, renouvellement
  clientId: integer("client_id").references(() => clients.id),
  statut: varchar("statut", { length: 20 }).notNull().default("en_attente"), // en_attente, fait, reporte
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Table des appels
export const appels = pgTable("appels", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  dateAppel: timestamp("date_appel").notNull(),
  duree: integer("duree"), // en minutes
  statut: varchar("statut", { length: 20 }).notNull(), // repondu, message_vocal, a_rappeler, occupe
  notes: text("notes"),
  prochainRappel: timestamp("prochain_rappel"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  devis: many(devis),
  documents: many(documents),
  rappels: many(rappels),
  appels: many(appels),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  devis: many(devis),
  documents: many(documents),
  rappels: many(rappels),
  appels: many(appels),
}));

export const devisRelations = relations(devis, ({ one, many }) => ({
  client: one(clients, {
    fields: [devis.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [devis.createdBy],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  devis: one(devis, {
    fields: [documents.devisId],
    references: [devis.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const rappelsRelations = relations(rappels, ({ one }) => ({
  client: one(clients, {
    fields: [rappels.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [rappels.createdBy],
    references: [users.id],
  }),
}));

export const appelsRelations = relations(appels, ({ one }) => ({
  client: one(clients, {
    fields: [appels.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [appels.createdBy],
    references: [users.id],
  }),
}));

// Schemas de validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  dateNaissance: z.string().min(1, "La date de naissance est requise").transform((val) => new Date(val)),
});

export const insertDevisSchema = createInsertSchema(devis).omit({
  id: true,
  numeroDevis: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  dateValidite: z.string().min(1, "La date de validité est requise").transform((val) => new Date(val)),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertRappelSchema = createInsertSchema(rappels).omit({
  id: true,
  createdAt: true,
  createdBy: true,
}).extend({
  dateRappel: z.string().min(1, "La date de rappel est requise").transform((val) => new Date(val)),
});

export const insertAppelSchema = createInsertSchema(appels).omit({
  id: true,
  createdAt: true,
  createdBy: true,
}).extend({
  dateAppel: z.string().min(1, "La date d'appel est requise").transform((val) => new Date(val)),
  prochainRappel: z.string().optional().nullable().transform((val) => val && val !== "" ? new Date(val) : null),
});

// Types TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Devis = typeof devis.$inferSelect;
export type InsertDevis = z.infer<typeof insertDevisSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Rappel = typeof rappels.$inferSelect;
export type InsertRappel = z.infer<typeof insertRappelSchema>;
export type Appel = typeof appels.$inferSelect;
export type InsertAppel = z.infer<typeof insertAppelSchema>;

// Schema de connexion
export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginData = z.infer<typeof loginSchema>;
