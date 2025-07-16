import { 
  users, 
  clients, 
  devis, 
  documents, 
  rappels, 
  appels,
  type User, 
  type InsertUser,
  type Client,
  type InsertClient,
  type Devis,
  type InsertDevis,
  type Document,
  type InsertDocument,
  type Rappel,
  type InsertRappel,
  type Appel,
  type InsertAppel
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Clients
  getClients(limit?: number, offset?: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  searchClients(query: string): Promise<Client[]>;
  
  // Devis
  getDevis(limit?: number, offset?: number): Promise<Devis[]>;
  getDevisByClient(clientId: number): Promise<Devis[]>;
  getDevisById(id: number): Promise<Devis | undefined>;
  createDevis(devis: InsertDevis): Promise<Devis>;
  updateDevis(id: number, devis: Partial<InsertDevis>): Promise<Devis>;
  deleteDevis(id: number): Promise<void>;
  
  // Documents
  getDocuments(limit?: number, offset?: number): Promise<Document[]>;
  getDocumentsByClient(clientId: number): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Rappels
  getRappels(limit?: number, offset?: number): Promise<Rappel[]>;
  getRappelsByClient(clientId: number): Promise<Rappel[]>;
  getRappelsToday(): Promise<Rappel[]>;
  createRappel(rappel: InsertRappel): Promise<Rappel>;
  updateRappel(id: number, rappel: Partial<InsertRappel>): Promise<Rappel>;
  deleteRappel(id: number): Promise<void>;
  
  // Appels
  getAppels(limit?: number, offset?: number): Promise<Appel[]>;
  getAppelsByClient(clientId: number): Promise<Appel[]>;
  createAppel(appel: InsertAppel): Promise<Appel>;
  updateAppel(id: number, appel: Partial<InsertAppel>): Promise<Appel>;
  deleteAppel(id: number): Promise<void>;
  
  // Statistiques
  getStats(): Promise<{
    totalClients: number;
    quotesGiven: number;
    contractsSigned: number;
    conversionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.role, users.nom);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Clients
  async getClients(limit = 50, offset = 0): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values({
        ...insertClient,
        dateNaissance: typeof insertClient.dateNaissance === 'string' 
          ? insertClient.dateNaissance 
          : insertClient.dateNaissance.toISOString().split('T')[0]
      })
      .returning();
    return client;
  }

  async updateClient(id: number, updateClient: Partial<InsertClient>): Promise<Client> {
    const updateData: any = { ...updateClient };
    if (updateData.dateNaissance && typeof updateData.dateNaissance !== 'string') {
      updateData.dateNaissance = updateData.dateNaissance.toISOString().split('T')[0];
    }
    
    const [client] = await db
      .update(clients)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        sql`${clients.nom} ILIKE ${`%${query}%`} OR ${clients.prenom} ILIKE ${`%${query}%`} OR ${clients.email} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(clients.createdAt));
  }

  // Devis
  async getDevis(limit = 50, offset = 0): Promise<Devis[]> {
    return await db
      .select()
      .from(devis)
      .orderBy(desc(devis.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDevisByClient(clientId: number): Promise<Devis[]> {
    return await db
      .select()
      .from(devis)
      .where(eq(devis.clientId, clientId))
      .orderBy(desc(devis.createdAt));
  }

  async getDevisById(id: number): Promise<Devis | undefined> {
    const [devisItem] = await db.select().from(devis).where(eq(devis.id, id));
    return devisItem || undefined;
  }

  async createDevis(insertDevis: InsertDevis): Promise<Devis> {
    const numeroDevis = `DEV-${Date.now()}`;
    const [devisItem] = await db
      .insert(devis)
      .values({
        ...insertDevis,
        numeroDevis,
        dateValidite: typeof insertDevis.dateValidite === 'string' 
          ? insertDevis.dateValidite 
          : insertDevis.dateValidite.toISOString().split('T')[0]
      })
      .returning();
    return devisItem;
  }

  async updateDevis(id: number, updateDevis: Partial<InsertDevis>): Promise<Devis> {
    const updateData: any = { ...updateDevis };
    if (updateData.dateValidite && typeof updateData.dateValidite !== 'string') {
      updateData.dateValidite = updateData.dateValidite.toISOString().split('T')[0];
    }
    
    const [devisItem] = await db
      .update(devis)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(devis.id, id))
      .returning();
    return devisItem;
  }

  async deleteDevis(id: number): Promise<void> {
    await db.delete(devis).where(eq(devis.id, id));
  }

  // Documents
  async getDocuments(limit = 50, offset = 0): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDocumentsByClient(clientId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.clientId, clientId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Rappels
  async getRappels(limit = 50, offset = 0): Promise<Rappel[]> {
    return await db
      .select()
      .from(rappels)
      .orderBy(desc(rappels.dateRappel))
      .limit(limit)
      .offset(offset);
  }

  async getRappelsByClient(clientId: number): Promise<Rappel[]> {
    return await db
      .select()
      .from(rappels)
      .where(eq(rappels.clientId, clientId))
      .orderBy(desc(rappels.dateRappel));
  }

  async getRappelsToday(): Promise<Rappel[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(rappels)
      .where(
        and(
          sql`${rappels.dateRappel} >= ${today}`,
          sql`${rappels.dateRappel} < ${tomorrow}`,
          eq(rappels.statut, "en_attente")
        )
      )
      .orderBy(rappels.dateRappel);
  }

  async createRappel(insertRappel: InsertRappel): Promise<Rappel> {
    const [rappel] = await db
      .insert(rappels)
      .values(insertRappel)
      .returning();
    return rappel;
  }

  async updateRappel(id: number, updateRappel: Partial<InsertRappel>): Promise<Rappel> {
    const [rappel] = await db
      .update(rappels)
      .set(updateRappel)
      .where(eq(rappels.id, id))
      .returning();
    return rappel;
  }

  async deleteRappel(id: number): Promise<void> {
    await db.delete(rappels).where(eq(rappels.id, id));
  }

  // Appels
  async getAppels(limit = 50, offset = 0): Promise<Appel[]> {
    return await db
      .select()
      .from(appels)
      .orderBy(desc(appels.dateAppel))
      .limit(limit)
      .offset(offset);
  }

  async getAppelsByClient(clientId: number): Promise<Appel[]> {
    return await db
      .select()
      .from(appels)
      .where(eq(appels.clientId, clientId))
      .orderBy(desc(appels.dateAppel));
  }

  async createAppel(insertAppel: InsertAppel): Promise<Appel> {
    const [appel] = await db
      .insert(appels)
      .values(insertAppel)
      .returning();
    return appel;
  }

  async updateAppel(id: number, updateAppel: Partial<InsertAppel>): Promise<Appel> {
    const [appel] = await db
      .update(appels)
      .set(updateAppel)
      .where(eq(appels.id, id))
      .returning();
    return appel;
  }

  async deleteAppel(id: number): Promise<void> {
    await db.delete(appels).where(eq(appels.id, id));
  }

  // Statistiques
  async getStats(): Promise<{
    totalClients: number;
    quotesGiven: number;
    contractsSigned: number;
    conversionRate: number;
  }> {
    const [totalClientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients);

    const [quotesGivenResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(devis)
      .where(eq(devis.statut, "envoye"));

    const [contractsSignedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(devis)
      .where(eq(devis.statut, "accepte"));

    const totalClients = totalClientsResult?.count || 0;
    const quotesGiven = quotesGivenResult?.count || 0;
    const contractsSigned = contractsSignedResult?.count || 0;
    const conversionRate = quotesGiven > 0 ? Math.round((contractsSigned / quotesGiven) * 100) : 0;

    return {
      totalClients,
      quotesGiven,
      contractsSigned,
      conversionRate,
    };
  }
}

export const storage = new DatabaseStorage();
