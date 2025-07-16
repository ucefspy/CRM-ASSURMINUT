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
  Eye
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    nom: "",
    prenom: "",
    role: "agent"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/users/stats"],
    enabled: currentUser?.role === 'admin',
  });

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
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      deleteUserMutation.mutate(userId);
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

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des utilisateurs</CardTitle>
            {canCreateUser && (
              <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-blue-600">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nouvel utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
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
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Rôle
                      </Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          {currentUser.role === 'admin' && (
                            <SelectItem value="superviseur">Superviseur</SelectItem>
                          )}
                          {currentUser.role === 'admin' && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDeleteSpecificUser(user) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
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
    </Layout>
  );
}