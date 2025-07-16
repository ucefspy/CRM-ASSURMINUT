import { Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  title: string;
  onNewClient?: () => void;
  onMenuClick?: () => void;
}

export function Header({ title, onNewClient, onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <h2 className="text-lg lg:text-2xl font-bold text-slate-800 truncate">{title}</h2>
            {!isMobile && (
              <>
                <span className="text-slate-500">|</span>
                <span className="text-slate-600 capitalize text-sm lg:text-base">{currentDate}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {!isMobile && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border-slate-200 pl-4 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent w-64"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <NotificationsDropdown />
            
            {onNewClient && (
              <Button 
                onClick={onNewClient} 
                className="bg-primary hover:bg-primary/80"
                size={isMobile ? "sm" : "default"}
              >
                <Plus className="h-4 w-4 mr-0 lg:mr-2" />
                <span className="hidden lg:inline">Nouveau client</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {isMobile && (
        <div className="mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border-slate-200 pl-4 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent w-full"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
      )}
    </header>
  );
}
