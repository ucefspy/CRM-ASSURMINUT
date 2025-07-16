import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, FileText, Phone, Upload, Mail, MapPin, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewClientModal } from "@/components/modals/new-client-modal";
import { NewDevisModal } from "@/components/modals/new-devis-modal";
import { CallLogModal } from "@/components/modals/call-log-modal";
import { ImportClientsModal } from "@/components/modals/import-clients-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Client } from "@shared/schema";

export default function Clients() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewDevisModal, setShowNewDevisModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients?.filter((client) =>
    client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "nouveau":
        return <Badge className="bg-green-100 text-green-800">Nouveau</Badge>;
      case "prospect":
        return <Badge className="bg-yellow-100 text-yellow-800">Prospect</Badge>;
      case "client":
        return <Badge className="bg-blue-100 text-blue-800">Client</Badge>;
      case "perdu":
        return <Badge className="bg-red-100 text-red-800">Perdu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const handleCreateDevis = (clientId: number) => {
    setSelectedClientId(clientId);
    setShowNewDevisModal(true);
  };

  const handleCreateCall = (clientId: number) => {
    setSelectedClientId(clientId);
    setShowCallLogModal(true);
  };

  // Composant pour l'affichage mobile en cartes
  const MobileClientCard = ({ client }: { client: Client }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-lg">{client.prenom} {client.nom}</h3>
            <div className="mt-1">{getStatusBadge(client.statut)}</div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateDevis(client.id)}
              className="text-blue-600 hover:text-blue-800 p-2"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateCall(client.id)}
              className="text-green-600 hover:text-green-800 p-2"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span className="truncate">{client.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>{client.telephone}</span>
          </div>
          {client.adresse && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{client.adresse}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(client.createdAt || "")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Clients" onNewClient={() => setShowNewClientModal(true)}>
      <div className="space-y-4">
        {/* Header avec actions - adapté mobile */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <CardTitle>Liste des clients ({filteredClients?.length || 0})</CardTitle>
              <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
                <div className="relative flex-1 lg:flex-none">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 lg:w-64"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setShowImportModal(true)} 
                    variant="outline"
                    className="flex-1 lg:flex-none"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                  </Button>
                  <Button 
                    onClick={() => setShowNewClientModal(true)}
                    className="flex-1 lg:flex-none"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal - Table desktop / Cards mobile */}
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-slate-600">Chargement...</p>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Affichage mobile en cartes
          <div>
            {filteredClients?.map((client) => (
              <MobileClientCard key={client.id} client={client} />
            ))}
            {filteredClients?.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-slate-600">Aucun client trouvé</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Affichage desktop en table
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients?.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.prenom} {client.nom}
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.telephone}</TableCell>
                        <TableCell>{getStatusBadge(client.statut)}</TableCell>
                        <TableCell>{formatDate(client.createdAt || "")}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateDevis(client.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateCall(client.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-slate-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <NewClientModal open={showNewClientModal} onClose={() => setShowNewClientModal(false)} />
      <NewDevisModal
        open={showNewDevisModal}
        onClose={() => {
          setShowNewDevisModal(false);
          setSelectedClientId(undefined);
        }}
        selectedClientId={selectedClientId}
      />
      <CallLogModal
        open={showCallLogModal}
        onClose={() => {
          setShowCallLogModal(false);
          setSelectedClientId(undefined);
        }}
        selectedClientId={selectedClientId}
      />
      <ImportClientsModal 
        open={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
    </Layout>
  );
}