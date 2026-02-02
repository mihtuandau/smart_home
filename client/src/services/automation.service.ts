import { automationApi } from '../lib/api';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  condition: {
    sensor?: string;
    operator?: string;
    value?: string;
    time?: string;
  };
  action: {
    device?: string;
    status?: string;
    notification?: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAutomationData {
  name: string;
  description?: string;
  condition: {
    sensor?: string;
    operator?: string;
    value?: string;
    time?: string;
  };
  action: {
    device?: string;
    status?: string;
    notification?: string;
  };
  isActive?: boolean;
}

export interface UpdateAutomationData extends Partial<CreateAutomationData> {}

/**
 * Automation Service
 * Quản lý tất cả các API calls liên quan đến automation rules
 */
export const automationService = {
  /**
   * Lấy danh sách tất cả automation rules
   */
  async getAllRules(): Promise<AutomationRule[]> {
    const response = await automationApi.getAutomationRules();
    return Array.isArray(response) ? response : [];
  },

  /**
   * Lấy danh sách automation rules đang hoạt động
   */
  async getActiveRules(): Promise<AutomationRule[]> {
    const response = await automationApi.getActiveAutomationRules();
    return Array.isArray(response) ? response : [];
  },

  /**
   * Lấy chi tiết một automation rule
   */
  async getRuleById(id: string): Promise<AutomationRule> {
    const response = await automationApi.getAutomationRule(id);
    return response as AutomationRule;
  },

  /**
   * Tạo automation rule mới
   */
  async createRule(data: CreateAutomationData): Promise<AutomationRule> {
    const response = await automationApi.createAutomationRule(data);
    return response as AutomationRule;
  },

  /**
   * Cập nhật automation rule
   */
  async updateRule(id: string, data: UpdateAutomationData): Promise<AutomationRule> {
    const response = await automationApi.updateAutomationRule(id, data);
    return response as AutomationRule;
  },

  /**
   * Xóa automation rule
   */
  async deleteRule(id: string): Promise<void> {
    await automationApi.deleteAutomationRule(id);
  },

  /**
   * Bật/tắt automation rule
   */
  async toggleRule(id: string): Promise<AutomationRule> {
    const response = await automationApi.toggleAutomationRule(id);
    return response as AutomationRule;
  },
};
