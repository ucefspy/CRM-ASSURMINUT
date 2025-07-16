import { Link, useLocation } from "wouter";
import { 
  Users, 
  FileText, 
  Folder, 
  Calendar, 
  Phone, 
  BarChart3,
  Shield,
  LogOut,
  X,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { path: "/dashboard", icon: BarChart3, label: "Tableau de bord" },
  { path: "/clients", icon: Users, label: "Clients" },
  { path: "/devis", icon: FileText, label: "Devis" },
  { path: "/documents", icon: Folder, label: "Documents" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/appels", icon: Phone, label: "Journal des appels" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen]);

  if (isMobile) {
    return (
      <>
        {/* Overlay mobile */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Sidebar mobile */}
        <nav className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <img 
                src="/assurminut-logo.png" 
                alt="ASSURMINUT Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-lg font-bold text-primary">ASSURMINUT</h1>
                <p className="text-xs text-muted-foreground">Assurance Auto</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <span 
                        className={`flex items-center space-x-3 rounded-lg px-4 py-3 font-medium transition-colors cursor-pointer ${
                          isActive 
                            ? "text-primary bg-primary/10" 
                            : "text-slate-600 hover:text-primary hover:bg-slate-50"
                        }`}
                        onClick={handleLinkClick}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.role}</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </nav>
      </>
    );
  }

  return (
    <nav className="bg-white shadow-lg w-64 min-h-screen border-r border-slate-200 hidden lg:block">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/assurminut-logo.png" 
            alt="ASSURMINUT Logo" 
            className="h-10 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-bold text-primary">ASSURMINUT</h1>
            <p className="text-sm text-muted-foreground">Assurance Auto</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <span className={`flex items-center space-x-3 rounded-lg px-4 py-3 font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-slate-600 hover:text-primary hover:bg-slate-50"
                  }`}>
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-200 rounded-full p-2">
            <Users className="text-slate-600 h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role === "admin" ? "Administrateur" : "Courtier"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
