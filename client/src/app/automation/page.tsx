'use client';

import React, { useState } from 'react';
import AutomationRuleList from '@/components/automation/AutomationRuleList';
import CreateAutomationModal from '@/components/automation/CreateAutomationModal';
import { useAutomation } from '@/hooks/useAutomation';

export default function AutomationPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tự động hóa</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Tạo và quản lý các quy tắc tự động cho hệ thống</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <span>+</span> Thêm quy tắc mới
        </button>
      </div>

      {/* Loading State */}
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

      {/* Empty State */}
      {!isLoading && rules.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có quy tắc nào</h3>
          <p className="text-gray-600 mb-6">Tạo quy tắc tự động đầu tiên để bắt đầu</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Tạo quy tắc đầu tiên
          </button>
        </div>
      )}

      {/* Rules List */}
      {!isLoading && rules.length > 0 && (
        <AutomationRuleList
          rules={rules}
          onEdit={setEditingRule}
          onDelete={handleDeleteRule}
          onToggle={handleToggleRule}
          onTrigger={handleTriggerRule}
        />
      )}

      {/* Create/Edit Modal */}
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
