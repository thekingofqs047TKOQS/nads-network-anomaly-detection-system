
export interface TrafficPacket {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  sourcePort: number;
  destPort: number;
  byteCount: number;
  isAnomaly: boolean;
  anomalyType?: string;
  severity?: 'Low' | 'Medium' | 'High';
  // Mock geo data for the threat map
  geo?: {
    lat: number;
    lng: number;
    country: string;
    city: string;
  };
}

export interface SystemStats {
  totalPackets: number;
  anomaliesDetected: number;
  avgPacketSize: number;
  systemHealth: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  affectedDevice: string;
  geo?: {
    lat: number;
    lng: number;
    country: string;
  };
}

export enum DashboardView {
  OVERVIEW = 'overview',
  TRAFFIC = 'traffic',
  ALERTS = 'alerts',
  THREAT_MAP = 'threat_map',
  PROJECT_INFO = 'project_info',
  AI_INSIGHTS = 'ai_insights'
}
