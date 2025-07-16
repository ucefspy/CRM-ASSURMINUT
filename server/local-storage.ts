// Stockage local temporaire en mémoire pour éviter les timeouts Supabase
import type { Client, InsertClient, Devis, InsertDevis, Rappel, InsertRappel, Appel, InsertAppel } from "@shared/schema";

// Données de démonstration
const clients: Client[] = [
  {
    id: 1,
    nom: "Durand",
    prenom: "Jean",
    email: "jean.durand@email.com",
    telephone: "0123456789",
    adresse: "123 rue de la Paix, 75001 Paris",
    dateNaissance: new Date("1980-05-15"),
    situationFamiliale: "Marié",
    profession: "Ingénieur",
    statut: "prospect",
    notes: "Intéressé par une mutuelle famille",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@email.com",
    telephone: "0987654321",
    adresse: "456 avenue des Champs, 69001 Lyon",
    dateNaissance: new Date("1985-09-22"),
    situationFamiliale: "Célibataire",
    profession: "Médecin",
    statut: "client",
    notes: "Cliente fidèle depuis 2 ans",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    nom: "Bernard",
    prenom: "Pierre",
    email: "pierre.bernard@email.com",
    telephone: "0147258369",
    adresse: "789 boulevard Saint-Germain, 75006 Paris",
    dateNaissance: new Date("1975-12-10"),
    situationFamiliale: "Marié",
    profession: "Avocat",
    statut: "client",
    notes: "Renouvellement à prévoir en mars",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const rappels: Rappel[] = [
  {
    id: 1,
    clientId: 1,
    titre: "Appel de suivi",
    description: "Rappeler pour devis mutuelle famille",
    dateRappel: new Date(),
    statut: "en_attente",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    clientId: 2,
    titre: "Renouvellement contrat",
    description: "Préparer le renouvellement annuel",
    dateRappel: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
    statut: "en_attente",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const devis: Devis[] = [
  {
    id: 1,
    clientId: 1,
    numero: "DEV-2025-001",
    dateDevis: new Date(),
    dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
    statut: "en_attente",
    montantHT: 1200,
    montantTTC: 1440,
    tva: 240,
    garanties: ["Hospitalisation", "Optique", "Dentaire"],
    notes: "Devis pour mutuelle famille",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const appels: Appel[] = [
  {
    id: 1,
    clientId: 1,
    dateAppel: new Date(),
    duree: 15,
    type: "sortant",
    statut: "termine",
    notes: "Discussion sur les besoins en mutuelle",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class LocalStorageService {
  // Clients
  async getClients(): Promise<Client[]> {
    return clients;
  }

  async getClient(id: number): Promise<Client | undefined> {
    return clients.find(c => c.id === id);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const newClient: Client = {
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
      nom: client.nom || '',
      prenom: client.prenom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      dateNaissance: client.dateNaissance || null,
      numeroSecu: client.numeroSecu || '',
      situationFamiliale: client.situationFamiliale || 'celibataire',
      nombreAyantsDroit: client.nombreAyantsDroit || 0,
      profession: client.profession || '',
      mutuelleActuelle: client.mutuelleActuelle || '',
      niveauCouverture: client.niveauCouverture || 'base',
      statut: client.statut || 'prospect',
      notes: client.notes || '',
      createdBy: client.createdBy || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    clients.push(newClient);
    console.log('Client créé dans le stockage local:', newClient.nom, newClient.prenom);
    return newClient;
  }

  // Rappels
  async getRappels(): Promise<Rappel[]> {
    return rappels;
  }

  async getRappelsToday(): Promise<Rappel[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return rappels.filter(r => r.dateRappel >= today && r.dateRappel < tomorrow);
  }

  async createRappel(rappel: InsertRappel): Promise<Rappel> {
    const newRappel: Rappel = {
      id: Math.max(...rappels.map(r => r.id)) + 1,
      ...rappel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    rappels.push(newRappel);
    return newRappel;
  }

  // Devis
  async getDevis(): Promise<Devis[]> {
    return devis;
  }

  async createDevis(devisData: InsertDevis): Promise<Devis> {
    const newDevis: Devis = {
      id: Math.max(...devis.map(d => d.id)) + 1,
      ...devisData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    devis.push(newDevis);
    return newDevis;
  }

  // Appels
  async getAppels(): Promise<Appel[]> {
    return appels;
  }

  async createAppel(appel: InsertAppel): Promise<Appel> {
    const newAppel: Appel = {
      id: Math.max(...appels.map(a => a.id)) + 1,
      ...appel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    appels.push(newAppel);
    return newAppel;
  }

  // Statistiques
  async getStats(): Promise<{
    totalClients: number;
    quotesGiven: number;
    contractsSigned: number;
    conversionRate: number;
  }> {
    const totalClients = clients.length;
    const quotesGiven = devis.length;
    const contractsSigned = clients.filter(c => c.statut === "client").length;
    const conversionRate = totalClients > 0 ? Math.round((contractsSigned / totalClients) * 100) : 0;

    return {
      totalClients,
      quotesGiven,
      contractsSigned,
      conversionRate
    };
  }
}

export const localStorageService = new LocalStorageService();