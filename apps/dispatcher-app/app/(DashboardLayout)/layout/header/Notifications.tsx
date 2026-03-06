"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { NotificationType, Notification } from "@/app/api/notifications/route";

const POLL_INTERVAL_MS = 30_000;

const typeConfig: Record<NotificationType, { icon: React.ReactNode; bg: string; color: string }> = {
  user_created: { icon: <Info className="h-4 w-4" />, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600" },
  error: { icon: <AlertCircle className="h-4 w-4" />, bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-600" },
  success: { icon: <CheckCircle className="h-4 w-4" />, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600" },
  info: { icon: <Info className="h-4 w-4" />, bg: "bg-muted", color: "text-muted-foreground" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !readIds.has(n.id)).length;
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));

  return (
    <div className="relative group/menu px-15">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative cursor-pointer">
            <span className="flex justify-center items-center rounded-full hover:text-primary">
              <Bell className="h-5 w-5" />
            </span>
            {unread > 0 && <span className="rounded-full absolute -end-[6px] -top-[5px] h-2 w-2 bg-primary" />}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-screen sm:w-[340px] py-4 rounded-sm border border-ld">
          <div className="flex items-center justify-between px-5 pb-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && <Badge className="h-5 px-1.5 text-[10px]">{unread} new</Badge>}
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Mark all read
                </button>
              )}
              <button onClick={handleManualRefresh} disabled={refreshing} className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50" title="Refresh">
                <RefreshCw className={`h-3.5 w-3.5 transition-transform ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <SimpleBar className="max-h-80">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                <Bell className="h-6 w-6 opacity-30" />
                <span>No recent activity</span>
              </div>
            ) : (
              notifications.map((item) => {
                const cfg = typeConfig[item.type];
                const isUnread = !readIds.has(item.id);
                return (
                  <div key={item.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors cursor-default ${isUnread ? "bg-muted/30" : ""}`}>
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium leading-tight ${!isUnread ? "text-muted-foreground" : ""}`}>{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                    </div>
                    {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                );
              })
            )}
          </SimpleBar>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
