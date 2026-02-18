
import React from 'react';

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8'
};

export const PROTOCOLS = ['TCP', 'UDP', 'ICMP'];
export const SEVERITIES = ['Low', 'Medium', 'High'];
export const ANOMALY_TYPES = [
  'DDoS Attack',
  'Port Scanning',
  'Data Exfiltration',
  'Unauthorized Access',
  'SQL Injection Attempt'
];

export const INITIAL_STATS = {
  totalPackets: 124582,
  anomaliesDetected: 42,
  avgPacketSize: 512,
  systemHealth: 98.4,
  precision: 0.965,
  recall: 0.942,
  f1Score: 0.953
};
