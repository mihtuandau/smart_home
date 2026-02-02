export interface EnergyData {
  timestamp: string;
  consumption: number;
  production?: number;
  gridUsage?: number;
}

export interface EnergyStats {
  totalConsumption: number;
  averageConsumption: number;
  peakConsumption: number;
  minConsumption: number;
  totalCost?: number;
  history: EnergyData[];
}

export interface BatteryStatus {
  percentage: number;
  voltage: number;
  current: number;
  temperature: number;
  status: 'charging' | 'discharging' | 'idle' | 'error';
  estimatedRuntime?: number;
}

export interface PowerSource {
  id: string;
  type: 'GRID' | 'SOLAR' | 'BATTERY' | 'GENERATOR';
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  output: number;
  capacity?: number;
}

export interface SolarStats {
  totalProduction: number;
  averageProduction: number;
  peakProduction: number;
  efficiency: number;
  history: EnergyData[];
}

export interface PowerSourceData {
  timestamp: string;
  grid: number;
  solar: number;
  battery: number;
  total: number;
}

export interface EnergyEfficiency {
  timestamp: string;
  efficiency: number;
  wastedEnergy: number;
}

export interface EfficiencyStats {
  averageEfficiency: number;
  totalWastedEnergy: number;
  history: EnergyEfficiency[];
}
