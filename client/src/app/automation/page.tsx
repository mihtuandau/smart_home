'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import AutomationRuleList from '@/components/automation/AutomationRuleList';
import CreateAutomationModal from '@/components/automation/CreateAutomationModal';
import { useAutomation } from '@/hooks/useAutomation';
import { Plus, Rocket } from 'lucide-react';

export default function AutomationPage() {
  const { t } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const {
    rules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  } = useAutomation();

  const handleCreateRule = async (ruleData: any) => {
    await createRule(ruleData);
    setIsCreateModalOpen(false);
  };

  const handleUpdateRule = async (id: string, ruleData: any) => {
    await updateRule(id, ruleData);
    setEditingRule(null);
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
  };

  const handleToggleRule = async (id: string) => {
    await toggleRule(id);
  };

  const handleTriggerRule = async (id: string) => {
    await toggleRule(id);
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{t('automation.title')}</h1>
          <p className="page-subtitle mt-1">{t('automation.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t('automation.createRule')}
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && rules.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Rocket className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('automation.noRules')}</h3>
          <p className="text-gray-600 mb-6">{t('automation.createFirst')}</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {t('automation.createRule')}
          </button>
        </div>
      )}

      {!isLoading && rules.length > 0 && (
        <AutomationRuleList
          rules={rules}
          onEdit={setEditingRule}
          onDelete={handleDeleteRule}
          onToggle={handleToggleRule}
          onTrigger={handleTriggerRule}
        />
      )}

      {(isCreateModalOpen || editingRule) && (
        <CreateAutomationModal
          rule={editingRule}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingRule(null);
          }}
          onCreate={handleCreateRule}
          onUpdate={handleUpdateRule}
        />
      )}
    </div>
  );
}
