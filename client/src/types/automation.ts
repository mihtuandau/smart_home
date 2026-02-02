export enum TriggerType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  TIME = 'TIME',
  MOTION = 'MOTION',
  LIGHT = 'LIGHT',
  MANUAL = 'MANUAL',
  DEVICE_STATE = 'DEVICE_STATE',
}

export enum ActionType {
  TURN_ON = 'TURN_ON',
  TURN_OFF = 'TURN_OFF',
  SET_VALUE = 'SET_VALUE',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  TRIGGER_SCENE = 'TRIGGER_SCENE',
}

export enum RuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
}

export interface Trigger {
  id?: string;
  type: TriggerType;
  condition: string;
  value?: any;
  compareOperator?: '>' | '<' | '==' | '>=' | '<=';
}

export interface Action {
  id?: string;
  type: ActionType;
  deviceId?: string;
  value?: any;
  description?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggers: Trigger[];
  actions: Action[];
  status: RuleStatus;
  isActive: boolean;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAutomationRuleRequest {
  name: string;
  description?: string;
  triggers: Trigger[];
  actions: Action[];
}

export interface UpdateAutomationRuleRequest {
  name?: string;
  description?: string;
  triggers?: Trigger[];
  actions?: Action[];
  status?: RuleStatus;
  isActive?: boolean;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  executionCount?: number;
}
