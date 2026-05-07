"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, Clock3, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const dateLocaleMap = {
  vi: "vi-VN",
  en: "en-US",
  zh: "zh-CN",
} as const;

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({
  onToggleSidebar,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t, language } = useLanguage();
  const activeTheme = theme ?? resolvedTheme ?? "light";
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const notificationRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current) {
        return;
      }
      if (notificationRef.current.contains(event.target as Node)) {
        return;
      }
      setIsNotificationOpen(false);
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  const notificationTitle =
    language === "en"
      ? "Notifications"
      : language === "zh"
        ? "通知"
        : "Thông báo";

  const notificationSubtitle =
    language === "en"
      ? "System / email notifications"
      : language === "zh"
        ? "系统 / 邮件通知"
        : "Thông báo hệ thống / email";

  const emptyNotificationText =
    language === "en"
      ? "No system or email notifications yet."
      : language === "zh"
        ? "暂无系统或邮件通知。"
        : "Chưa có thông báo hệ thống hoặc email nào.";

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return t("dashboard.title");
      case "/energy":
        return t("energy.title");
      case "/sensors":
        return t("sensors.title");
      default:
        if (pathname?.includes("/devices")) return t("devices.title");
        if (pathname?.includes("/automation")) return t("automation.title");
        if (pathname?.includes("/settings")) return t("settings.title");
        if (pathname?.includes("/reports")) return t("reports.title");
        return t("dashboard.title");
    }
  };

  const getPageSubtitle = () => {
    switch (pathname) {
      case "/dashboard":
        return t("dashboard.subtitle");
      case "/energy":
        return t("energy.subtitle");
      case "/sensors":
        return t("sensors.subtitle");
      default:
        if (pathname?.includes("/devices")) return t("devices.subtitle");
        if (pathname?.includes("/automation")) return t("automation.subtitle");
        if (pathname?.includes("/settings")) return t("settings.subtitle");
        if (pathname?.includes("/reports")) return t("reports.subtitle");
        return "";
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="px-3 sm:px-6 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              aria-label={t("sidebar.closeMenu")}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {getPageTitle()}
              </h2>
              {getPageSubtitle() && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {getPageSubtitle()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Clock3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">
                {currentTime.toLocaleTimeString(dateLocaleMap[language], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            <button
              onClick={() =>
                setTheme(activeTheme === "dark" ? "light" : "dark")
              }
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              aria-label={
                activeTheme === "dark"
                  ? t("theme.switchLight")
                  : t("theme.switchDark")
              }
              title={
                activeTheme === "dark"
                  ? t("theme.switchLight")
                  : t("theme.switchDark")
              }
            >
              {activeTheme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <LanguageSwitcher />

            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationOpen((open) => !open);
                }}
                className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all group"
              >
                <Bell className="h-6 w-6" />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-[min(90vw,360px)] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">
                      {notificationTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notificationSubtitle}
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                      {emptyNotificationText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
