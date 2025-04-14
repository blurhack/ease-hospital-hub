
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  BedDouble, 
  CalendarDays, 
  CreditCard, 
  FileText, 
  Home, 
  Hospital, 
  Menu, 
  Users,
  Database,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  roles: Array<"admin" | "doctor" | "staff">;
};

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
    roles: ["admin", "doctor", "staff"],
  },
  {
    title: "Doctors",
    icon: Hospital,
    href: "/doctors",
    roles: ["admin", "staff"],
  },
  {
    title: "Patients",
    icon: Users,
    href: "/patients",
    roles: ["admin", "doctor", "staff"],
  },
  {
    title: "Rooms",
    icon: BedDouble,
    href: "/rooms",
    roles: ["admin", "staff"],
  },
  {
    title: "Appointments",
    icon: CalendarDays,
    href: "/appointments",
    roles: ["admin", "doctor", "staff"],
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
    roles: ["admin", "staff"],
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
    roles: ["admin"],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    roles: ["admin"],
  },
  {
    title: "SQL Console",
    icon: Database,
    href: "/sql-console",
    roles: ["admin"],
  },
];

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!user) return null;

  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground shadow-lg transition-all duration-300 z-30",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 justify-between">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-white p-1 rounded">
                <Hospital className="text-primary h-6 w-6" />
              </div>
              <span className="font-bold text-xl">MediEase</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="p-2">
            <ul className="space-y-1">
              {filteredItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      location.pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-accent">
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <>
                <div className="rounded-full bg-white p-1">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs opacity-80 capitalize">{user.role}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
