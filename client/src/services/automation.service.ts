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

export const automationService = {
  async getAllRules(): Promise<AutomationRule[]> {
    const response = await automationApi.getAutomationRules();
    return Array.isArray(response) ? response : [];
  },

  async getActiveRules(): Promise<AutomationRule[]> {
    const response = await automationApi.getActiveAutomationRules();
    return Array.isArray(response) ? response : [];
  },

  async getRuleById(id: string): Promise<AutomationRule> {
    const response = await automationApi.getAutomationRule(id);
    return response as AutomationRule;
  },

  async createRule(data: CreateAutomationData): Promise<AutomationRule> {
    const response = await automationApi.createAutomationRule(data);
    return response as AutomationRule;
  },

  async updateRule(id: string, data: UpdateAutomationData): Promise<AutomationRule> {
    const response = await automationApi.updateAutomationRule(id, data);
    return response as AutomationRule;
  },

  async deleteRule(id: string): Promise<void> {
    await automationApi.deleteAutomationRule(id);
  },

  async toggleRule(id: string): Promise<AutomationRule> {
    const response = await automationApi.toggleAutomationRule(id);
    return response as AutomationRule;
  },
};
