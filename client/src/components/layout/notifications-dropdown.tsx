import { useState } from "react";
import { Bell, Calendar, Users, FileText, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "rappel" | "nouveau_client" | "devis_expire" | "document_recu";
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "rappel":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "nouveau_client":
      return <Users className="h-4 w-4 text-green-500" />;
    case "devis_expire":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "document_recu":
      return <FileText className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  // Récupérer les rappels du jour
  const { data: rappelsToday = [] } = useQuery({
    queryKey: ["/api/rappels/today"],
    enabled: true,
  });

  // Récupérer les clients récents
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: true,
  });

  // Créer les notifications basées sur les données réelles
  const notifications: Notification[] = [
    // Rappels du jour
    ...rappelsToday.map((rappel: any) => ({
      id: `rappel-${rappel.id}`,
      type: "rappel" as const,
      title: "Rappel prévu",
      message: `${rappel.titre} - ${rappel.client_nom}`,
      time: new Date(rappel.date_rappel).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
      priority: "high" as const,
      actionUrl: `/agenda`,
    })),
    
    // Nouveaux clients (dernières 24h)
    ...clients
      .filter((client: any) => {
        const clientDate = new Date(client.createdAt);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return clientDate > yesterday;
      })
      .slice(0, 3)
      .map((client: any) => ({
        id: `client-${client.id}`,
        type: "nouveau_client" as const,
        title: "Nouveau client",
        message: `${client.nom} ${client.prenom} ajouté`,
        time: new Date(client.createdAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
        priority: "medium" as const,
        actionUrl: `/clients`,
      })),
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    console.log("Marquer comme lu:", notificationId);
  };

  const markAllAsRead = () => {
    console.log("Marquer tout comme lu");
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-auto p-1 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                      !notification.read && "bg-blue-50 border-l-4 border-l-blue-500"
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                getPriorityColor(notification.priority)
                              )}
                            />
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {notification.time}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="h-auto p-1 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Voir toutes les notifications
            </Button>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}