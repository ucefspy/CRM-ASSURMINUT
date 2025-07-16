import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  FileText, 
  Handshake, 
  TrendingUp,
  UserPlus,
  Upload,
  Phone,
  AlertCircle,
  Clock,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Eye,
  UserCheck
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { NewClientModal } from "@/components/modals/new-client-modal";
import { NewDevisModal } from "@/components/modals/new-devis-modal";
import { DocumentUploadModal } from "@/components/modals/document-upload-modal";
import { CallLogModal } from "@/components/modals/call-log-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client, Rappel } from "@shared/schema";

interface Stats {
  totalClients: number;
  quotesGiven: number;
  contractsSigned: number;
  conversionRate: number;
}

export default function Dashboard() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewDevisModal, setShowNewDevisModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: todayReminders } = useQuery<Rappel[]>({
    queryKey: ["/api/rappels/today"],
  });

  // Mutation pour mettre à jour le statut d'un client
  const updateClientStatusMutation = useMutation({
    mutationFn: async ({ clientId, newStatus }: { clientId: number; newStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/clients/${clientId}`, {
        statut: newStatus
      });
      return response.json();
    },
    onSuccess: (updatedClient) => {
      toast({
        title: "Statut mis à jour",
        description: `Le statut du client a été modifié avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (clientId: number, newStatus: string) => {
    updateClientStatusMutation.mutate({ clientId, newStatus });
  };

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

  // Composant pour un bouton de statut interactif
  const StatusButton = ({ client }: { client: Client }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statusOptions = [
      { value: "nouveau", label: "Nouveau", color: "bg-green-100 text-green-800" },
      { value: "prospect", label: "Prospect", color: "bg-yellow-100 text-yellow-800" },
      { value: "client", label: "Client", color: "bg-blue-100 text-blue-800" },
      { value: "perdu", label: "Perdu", color: "bg-red-100 text-red-800" }
    ];

    const currentStatus = statusOptions.find(s => s.value === client.statut);
    
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto p-1 hover:bg-slate-100"
            disabled={updateClientStatusMutation.isPending}
          >
            <Badge className={`${currentStatus?.color} cursor-pointer hover:opacity-80`}>
              {currentStatus?.label}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="p-2">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Changer le statut de {client.prenom} {client.nom}
            </p>
          </div>
          <DropdownMenuSeparator />
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                if (option.value !== client.statut) {
                  handleStatusChange(client.id, option.value);
                }
                setIsOpen(false);
              }}
              className="flex items-center space-x-3 cursor-pointer"
              disabled={option.value === client.statut}
            >
              <UserCheck className="h-4 w-4" />
              <span className={option.value === client.statut ? "font-medium" : ""}>
                {option.label}
              </span>
              {option.value === client.statut && (
                <span className="text-xs text-slate-500 ml-auto">Actuel</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // Ici on pourrait ouvrir une modal pour voir les détails du client
              console.log("Voir détails client:", client.id);
              setIsOpen(false);
            }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>Voir les détails</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "appel":
        return <AlertCircle className="h-4 w-4" />;
      case "rdv":
        return <Clock className="h-4 w-4" />;
      case "renouvellement":
        return <FileCheck className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getReminderClass = (type: string) => {
    switch (type) {
      case "appel":
        return "bg-red-50 border-red-200";
      case "rdv":
        return "bg-yellow-50 border-yellow-200";
      case "renouvellement":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout title="Tableau de bord" onNewClient={() => setShowNewClientModal(true)}>
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total clients</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {statsLoading ? "..." : stats?.totalClients || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <Users className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+12%</span>
              <span className="text-slate-500 text-sm ml-2">ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Devis envoyés</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {statsLoading ? "..." : stats?.quotesGiven || 0}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <FileText className="text-green-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+8%</span>
              <span className="text-slate-500 text-sm ml-2">ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Contrats signés</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {statsLoading ? "..." : stats?.contractsSigned || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-full">
                <Handshake className="text-yellow-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+15%</span>
              <span className="text-slate-500 text-sm ml-2">ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Taux de conversion</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {statsLoading ? "..." : `${stats?.conversionRate || 0}%`}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-full">
                <TrendingUp className="text-purple-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+3%</span>
              <span className="text-slate-500 text-sm ml-2">ce mois</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente et actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Clients récents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clients récents</CardTitle>
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients?.slice(0, 3).map((client) => (
                <div key={client.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                    {getInitials(client.prenom, client.nom)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">
                      {client.prenom} {client.nom}
                    </p>
                    <p className="text-sm text-slate-500">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <StatusButton client={client} />
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(client.createdAt || "")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => setShowNewClientModal(true)}
                className="w-full justify-start bg-primary hover:bg-blue-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nouveau client
              </Button>
              
              <Button
                onClick={() => setShowNewDevisModal(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Créer un devis
              </Button>
              
              <Button
                onClick={() => setShowDocumentUploadModal(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Téléverser document
              </Button>
              
              <Button
                onClick={() => setShowCallLogModal(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <Phone className="h-4 w-4 mr-2" />
                Enregistrer appel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rappels et calendrier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rappels du jour */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rappels du jour</CardTitle>
              <Badge variant="destructive">
                {todayReminders?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayReminders?.map((reminder) => (
                <div key={reminder.id} className={`flex items-start space-x-4 p-4 rounded-lg border ${getReminderClass(reminder.type)}`}>
                  <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs mt-1">
                    {getReminderIcon(reminder.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{reminder.titre}</p>
                    <p className="text-sm text-slate-600">{reminder.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatTime(reminder.dateRappel)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <FileCheck className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {(!todayReminders || todayReminders.length === 0) && (
                <p className="text-slate-500 text-center py-8">
                  Aucun rappel pour aujourd'hui
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mini calendrier */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agenda</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div key={day} className="text-xs font-medium text-slate-500 p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i}
                  className={`p-2 text-sm ${
                    i + 1 === new Date().getDate()
                      ? "bg-primary text-white rounded-full"
                      : "text-slate-800 hover:bg-slate-100 rounded-full"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <NewClientModal open={showNewClientModal} onClose={() => setShowNewClientModal(false)} />
      <NewDevisModal open={showNewDevisModal} onClose={() => setShowNewDevisModal(false)} />
      <DocumentUploadModal open={showDocumentUploadModal} onClose={() => setShowDocumentUploadModal(false)} />
      <CallLogModal open={showCallLogModal} onClose={() => setShowCallLogModal(false)} />
    </Layout>
  );
}
