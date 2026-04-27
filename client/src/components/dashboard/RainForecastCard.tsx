"use client";

import React from "react";
import { useRainForecast } from "@/hooks/rain";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cloud, Droplets, TrendingDown, AlertCircle } from "lucide-react";

function getProbabilityLabel(
  probability: number,
  t: (key: string) => string,
): {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
  descKey: string;
} {
  if (probability >= 0.8) {
    return {
      label: "Very High",
      color: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      emoji: "⛈️",
      descKey: "dashboard.likely_to_rain",
    };
  }
  if (probability >= 0.6) {
    return {
      label: "High",
      color: "text-orange-700 dark:text-orange-300",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      emoji: "🌧️",
      descKey: "dashboard.probably_raining",
    };
  }
  if (probability >= 0.4) {
    return {
      label: "Moderate",
      color: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      emoji: "⛅",
      descKey: "dashboard.maybe_rain",
    };
  }
  if (probability >= 0.2) {
    return {
      label: "Low",
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      emoji: "🌤️",
      descKey: "dashboard.unlikely_to_rain",
    };
  }
  return {
    label: "Very Low",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    emoji: "☀️",
    descKey: "dashboard.no_rain_expected",
  };
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeatherDescription(
  clouds?: number,
  windSpeed?: number,
  humidity?: number,
): string {
  const descriptions: string[] = [];

  // Mô tả về mây
  if (clouds !== undefined) {
    if (clouds >= 80) {
      descriptions.push("Trời nhiều mây");
    } else if (clouds >= 50) {
      descriptions.push("Trời quang");
    } else if (clouds >= 20) {
      descriptions.push("Trời khá quang");
    } else {
      descriptions.push("Trời quang ánh sáng");
    }
  }

  // Mô tả về gió
  if (windSpeed !== undefined) {
    if (windSpeed > 7) {
      descriptions.push("Gió mạnh");
    } else if (windSpeed > 4) {
      descriptions.push("Gió vừa");
    }
  }

  // Mô tả về độ ẩm
  if (humidity !== undefined) {
    if (humidity > 85) {
      descriptions.push("Ẩm cao");
    } else if (humidity < 30) {
      descriptions.push("Ẩm thấp");
    }
  }

  return descriptions.join(" · ");
}

interface RainForecastCardProps {
  lat?: number;
  lon?: number;
}

export default function RainForecastCard({ lat, lon }: RainForecastCardProps) {
  const { data: report, isLoading, error } = useRainForecast(lat, lon);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border animate-pulse">
        <div className="h-48 bg-muted rounded"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">
            {t("dashboard.rain_forecast_error") || "Unable to load forecast"}
          </span>
        </div>
      </div>
    );
  }

  const nextHour = report.adjusted_hourly[0];
  if (!nextHour) {
    return null;
  }

  const { label, color, bgColor, emoji, descKey } = getProbabilityLabel(
    nextHour.adjusted_pop,
    t,
  );
  const probabilityPercent = Math.round(nextHour.adjusted_pop * 100);
  const forecastPercent = Math.round(nextHour.forecast_pop * 100);
  const adjustment = probabilityPercent - forecastPercent;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Main Probability Section - BIG & CLEAR */}
      <div className={`px-4 sm:px-6 py-6 sm:py-8 text-center ${bgColor}`}>
        <div className="flex justify-center gap-2 mb-2">
          <span className="text-4xl">{emoji}</span>
        </div>
        <p className="text-sm font-semibold text-muted-foreground m-5">
          {t("dashboard.current_rain_probability")}
        </p>
        <div className="flex items-baseline justify-center gap-3 mb-3">
          <span className={`text-7xl font-bold ${color}`}>
            {probabilityPercent}%
          </span>
          <span className={`text-sm font-semibold ${color}`}>{t(descKey)}</span>
        </div>

        {/* Weather Description */}
      </div>



      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t("dashboard.updated")}: {formatTime(report.generated_at)}
        </p>
        <p className="text-xs text-muted-foreground">
          {report.aligned_records} {t("dashboard.local_readings_checked")}
        </p>
      </div>
    </div>
  );
}
