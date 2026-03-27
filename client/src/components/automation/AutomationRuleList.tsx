"use client";

import React from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { ChartColumn, Pencil, Play, Plug, Trash2, Volume2 } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  condition: any;
  action: any;
  isActive: boolean;
  createdAt?: string;
}

interface AutomationRuleListProps {
  rules: AutomationRule[];
  onEdit: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onTrigger: (id: string) => void;
}

export default function AutomationRuleList({
  rules,
  onEdit,
  onDelete,
  onToggle,
  onTrigger,
}: AutomationRuleListProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {rule.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rule.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {rule.isActive ? `✓ ${t('automation.active')}` : `○ ${t('automation.inactive')}`}
                </span>
              </div>
              {rule.description && (
                <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
              )}
            </div>

            <button
              onClick={() => onToggle(rule.id, rule.isActive)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                rule.isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  rule.isActive ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                {t('automation.condition')}
              </p>
              <div className="space-y-1">
                {rule.condition?.sensor && (
                  <p className="text-sm text-gray-800 inline-flex items-center gap-1.5">
                    <ChartColumn className="w-4 h-4" /> {rule.condition.sensor}
                    {rule.condition.operator && ` ${rule.condition.operator}`}
                    {rule.condition.value && ` ${rule.condition.value}`}
                  </p>
                )}
                {rule.condition?.time && (
                  <p className="text-sm text-gray-800">
                    🕐 {rule.condition.time}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                {t('automation.action')}
              </p>
              <div className="space-y-1">
                {rule.action?.device && (
                  <p className="text-sm text-gray-800 inline-flex items-center gap-1.5">
                    <Plug className="w-4 h-4" /> {rule.action.device}
                    {rule.action.status && ` → ${rule.action.status}`}
                  </p>
                )}
                {rule.action?.notification && (
                  <p className="text-sm text-gray-800 inline-flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> {rule.action.notification}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onTrigger(rule.id)}
              disabled={!rule.isActive}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5" /> {t('automation.test')}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(rule)}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition inline-flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5" /> {t('automation.edit')}
              </button>
              <button
                onClick={() => onDelete(rule.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
