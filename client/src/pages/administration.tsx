import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  AlertCircle,
  Crown,
  Eye,
  Plus,
  UserX,
  Key,
  MoreVertical,
  Power,
  PowerOff,
  Activity,
  Clock
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface UserStats {
  total: number;
  admin: number;
  superviseur: number;
  agent: number;
  active: number;
  inactive: number;
}

export default function AdministrationPage() {
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createUserType, setCreateUserType] = useState<"agent" | "superviseur" | "admin">("agent");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    nom: "",
    prenom: "",
    role: "agent"
  });
  const [editUser, setEditUser] = useState({
    username: "",
    email: "",
    nom: "",
    prenom: "",
    role: "agent"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: usersResponse, isLoading: usersLoading } = useQuery<{users: User[]}>({
    queryKey: ["/api/users"],
  });

  const { data: userStatsResponse } = useQuery<{stats: UserStats}>({
    queryKey: ["/api/users/stats"],
    enabled: currentUser?.role === 'admin',
  });

  const users = usersResponse?.users || [];
  const userStats = userStatsResponse?.stats;

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      setShowCreateUserModal(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        nom: "",
        prenom: "",
        role: "agent"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: any }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      setShowEditUserModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, actif }: { userId: number; actif: boolean }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, { actif });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.actif ? "Utilisateur activé" : "Utilisateur désactivé",
        description: `L'utilisateur a été ${variables.actif ? "activé" : "désactivé"} avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du changement de statut.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/users/${userId}/reset-password`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mot de passe réinitialisé",
        description: `Nouveau mot de passe: ${data.tempPassword}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la réinitialisation du mot de passe.",
        variant: "destructive",
      });
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case "superviseur":
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Superviseur</Badge>;
      case "agent":
        return <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Agent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>;
    }
  };

  const canCreateUser = currentUser?.role === 'admin' || currentUser?.role === 'superviseur';
  const canDeleteUser = currentUser?.role === 'admin' || currentUser?.role === 'superviseur';

  const handleCreateUser = () => {
    createUserMutation.mutate({...newUser, role: createUserType});
  };

  const openCreateUserModal = (userType: "agent" | "superviseur" | "admin") => {
    setCreateUserType(userType);
    setNewUser({
      username: "",
      email: "",
      password: "",
      nom: "",
      prenom: "",
      role: userType
    });
    setShowCreateUserModal(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        userData: editUser
      });
    }
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({
      userId,
      actif: !currentStatus
    });
  };

  const handleResetPassword = (userId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?")) {
      resetPasswordMutation.mutate(userId);
    }
  };

  // Vérifier si l'utilisateur peut supprimer un utilisateur spécifique
  const canDeleteSpecificUser = (targetUser: User) => {
    if (currentUser?.role === 'admin') {
      return targetUser.role !== 'admin' && targetUser.id !== currentUser.id;
    }
    if (currentUser?.role === 'superviseur') {
      return targetUser.role === 'agent';
    }
    return false;
  };

  if (!currentUser || !['admin', 'superviseur'].includes(currentUser.role)) {
    return (
      <Layout title="Administration">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Administration">
      {/* Statistiques des utilisateurs - Admin uniquement */}
      {currentUser.role === 'admin' && userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total utilisateurs</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{userStats.total}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <Users className="text-blue-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Admin</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{userStats.admin}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-full">
                  <Crown className="text-red-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Superviseurs</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{userStats.superviseur}/4</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <Shield className="text-blue-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Agents</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{userStats.agent}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <UserCheck className="text-green-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section de création d'utilisateurs avec onglets */}
      {canCreateUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Créer un nouveau compte</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="agent" className="w-full">
              <TabsList className={`grid w-full ${currentUser?.role === 'admin' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                <TabsTrigger value="agent" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Agent
                </TabsTrigger>
                {currentUser?.role === 'admin' && (
                  <TabsTrigger value="superviseur" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Superviseur
                  </TabsTrigger>
                )}
                {currentUser?.role === 'admin' && (
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="agent" className="mt-4">
                <div className="text-center py-6">
                  <UserCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Créer un compte Agent</h3>
                  <p className="text-gray-600 mb-4">
                    Les agents ont accès aux fonctionnalités CRM standard : gestion des clients, devis, documents et appels.
                  </p>
                  <Button 
                    onClick={() => openCreateUserModal("agent")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un Agent
                  </Button>
                </div>
              </TabsContent>
              
              {currentUser?.role === 'admin' && (
                <TabsContent value="superviseur" className="mt-4">
                  <div className="text-center py-6">
                    <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Créer un compte Superviseur</h3>
                    <p className="text-gray-600 mb-4">
                      Les superviseurs peuvent gérer les agents et accéder à la page d'administration.
                      <br />
                      <span className="text-sm text-orange-600 font-medium">
                        Limite : 4 superviseurs maximum
                      </span>
                    </p>
                    <Button 
                      onClick={() => openCreateUserModal("superviseur")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un Superviseur
                    </Button>
                  </div>
                </TabsContent>
              )}
              
              {currentUser?.role === 'admin' && (
                <TabsContent value="admin" className="mt-4">
                  <div className="text-center py-6">
                    <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Créer un compte Admin</h3>
                    <p className="text-gray-600 mb-4">
                      Les administrateurs ont un accès total au système et peuvent gérer tous les utilisateurs.
                      <br />
                      <span className="text-sm text-red-600 font-medium">
                        Attention : Pouvoir total sur le système
                      </span>
                    </p>
                    <Button 
                      onClick={() => openCreateUserModal("admin")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un Admin
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des utilisateurs</CardTitle>
            {canCreateUser && (
              <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="hidden">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nouvel utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {createUserType === 'agent' && <UserCheck className="h-5 w-5 text-green-500" />}
                      {createUserType === 'superviseur' && <Shield className="h-5 w-5 text-blue-500" />}
                      {createUserType === 'admin' && <Crown className="h-5 w-5 text-red-500" />}
                      Créer un compte {createUserType === 'agent' ? 'Agent' : createUserType === 'superviseur' ? 'Superviseur' : 'Admin'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Nom d'utilisateur
                      </Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="col-span-3"
                        placeholder={`ex: ${createUserType}1`}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="col-span-3"
                        placeholder={`${createUserType}1@crm.com`}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Mot de passe
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="col-span-3"
                        placeholder="Mot de passe sécurisé"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nom" className="text-right">
                        Nom
                      </Label>
                      <Input
                        id="nom"
                        value={newUser.nom}
                        onChange={(e) => setNewUser({...newUser, nom: e.target.value})}
                        className="col-span-3"
                        placeholder="Nom de famille"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="prenom" className="text-right">
                        Prénom
                      </Label>
                      <Input
                        id="prenom"
                        value={newUser.prenom}
                        onChange={(e) => setNewUser({...newUser, prenom: e.target.value})}
                        className="col-span-3"
                        placeholder="Prénom"
                      />
                    </div>
                    
                    {/* Affichage du rôle sélectionné */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Rôle</Label>
                      <div className="col-span-3">
                        {createUserType === 'agent' && (
                          <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Agent
                          </Badge>
                        )}
                        {createUserType === 'superviseur' && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Superviseur
                          </Badge>
                        )}
                        {createUserType === 'admin' && (
                          <Badge className="bg-red-100 text-red-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "Création..." : "Créer"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-slate-600">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-slate-700">Utilisateur</th>
                    <th className="text-left p-3 font-medium text-slate-700">Email</th>
                    <th className="text-left p-3 font-medium text-slate-700">Rôle</th>
                    <th className="text-left p-3 font-medium text-slate-700">Statut</th>
                    <th className="text-left p-3 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                            {user.prenom.charAt(0)}{user.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.prenom} {user.nom}</p>
                            <p className="text-sm text-slate-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{user.email}</td>
                      <td className="p-3">{getRoleBadge(user.role)}</td>
                      <td className="p-3">
                        <Badge className={user.actif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleToggleUserStatus(user.id, user.actif)}
                              >
                                {user.actif ? (
                                  <>
                                    <PowerOff className="h-4 w-4 mr-2 text-red-500" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 mr-2 text-green-500" />
                                    Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                                <Key className="h-4 w-4 mr-2" />
                                Réinitialiser mot de passe
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {canDeleteSpecificUser(user) && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deleteUserMutation.isPending}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition d'utilisateur */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier l'utilisateur
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Nom d'utilisateur
              </Label>
              <Input
                id="edit-username"
                value={editUser.username}
                onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-nom" className="text-right">
                Nom
              </Label>
              <Input
                id="edit-nom"
                value={editUser.nom}
                onChange={(e) => setEditUser({...editUser, nom: e.target.value})}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prenom" className="text-right">
                Prénom
              </Label>
              <Input
                id="edit-prenom"
                value={editUser.prenom}
                onChange={(e) => setEditUser({...editUser, prenom: e.target.value})}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Rôle
              </Label>
              <Select 
                value={editUser.role} 
                onValueChange={(value) => setEditUser({...editUser, role: value})}
                disabled={updateUserMutation.isPending}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  {currentUser?.role === 'admin' && (
                    <SelectItem value="superviseur">Superviseur</SelectItem>
                  )}
                  {currentUser?.role === 'admin' && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateUser} 
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails d'utilisateur */}
      <Dialog open={showUserDetailsModal} onOpenChange={setShowUserDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de l'utilisateur
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nom complet</Label>
                  <p className="text-lg font-semibold">{selectedUser.prenom} {selectedUser.nom}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nom d'utilisateur</Label>
                  <p className="text-lg">@{selectedUser.username}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-lg">{selectedUser.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Rôle</Label>
                  <div>{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <Badge className={selectedUser.actif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {selectedUser.actif ? (
                      <>
                        <Activity className="h-3 w-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <UserX className="h-3 w-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Date de création</Label>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('fr-FR') : 'Non disponible'}
                  </p>
                </div>
              </div>

              {/* Permissions basées sur le rôle */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedUser.role === 'admin' && (
                    <>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 text-red-600 mr-2" />
                          <span className="text-sm font-medium">Administrateur système</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium">Gestion utilisateurs</span>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'superviseur' && (
                    <>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium">Supervision d'équipe</span>
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <UserPlus className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium">Création d'agents</span>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'agent' && (
                    <>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium">Gestion clients</span>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium">Accès standard</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowUserDetailsModal(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}