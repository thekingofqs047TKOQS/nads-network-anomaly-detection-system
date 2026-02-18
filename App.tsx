
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  LayoutDashboard, 
  Info, 
  Database, 
  ChevronRight, 
  Search,
  Cpu,
  RefreshCw,
  BrainCircuit,
  Bell,
  Terminal,
  Server,
  Globe,
  Filter,
  X,
  ArrowUpDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import L from 'leaflet';
import { TrafficPacket, AnomalyAlert, SystemStats, DashboardView } from './types';
import { INITIAL_STATS, PROTOCOLS, SEVERITIES, ANOMALY_TYPES, COLORS } from './constants';
import { geminiService } from './services/geminiService';

// Mock Locations for Threat Map
const MOCK_LOCATIONS = [
  { city: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { city: 'Dodoma', country: 'Tanzania', lat: -6.1722, lng: 35.7481 },
  { city: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Sao Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
];

const generatePacket = (id: string): TrafficPacket => {
  const isAnomaly = Math.random() > 0.95;
  const sourcePort = Math.floor(Math.random() * 65535);
  const destPort = [80, 443, 22, 53, 3306, 5432][Math.floor(Math.random() * 6)];
  const location = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
  
  return {
    id,
    timestamp: new Date().toLocaleTimeString(),
    sourceIp: isAnomaly ? `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : `192.168.1.${Math.floor(Math.random() * 255)}`,
    destIp: `10.0.0.${Math.floor(Math.random() * 50)}`,
    protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)] as any,
    sourcePort,
    destPort,
    byteCount: isAnomaly ? 5000 + Math.random() * 10000 : 64 + Math.random() * 1500,
    isAnomaly,
    anomalyType: isAnomaly ? ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)] : undefined,
    severity: isAnomaly ? SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)] as any : undefined,
    geo: isAnomaly ? location : undefined,
  };
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<DashboardView>(DashboardView.OVERVIEW);
  const [traffic, setTraffic] = useState<TrafficPacket[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [stats, setStats] = useState<SystemStats>(INITIAL_STATS);
  const [isCapturing, setIsCapturing] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Data
  useEffect(() => {
    const initialTraffic = Array.from({ length: 20 }, (_, i) => generatePacket(`p-${Date.now()}-${i}`));
    setTraffic(initialTraffic);
    
    const initialAlerts = initialTraffic
      .filter(p => p.isAnomaly)
      .map(p => ({
        id: `a-${p.id}`,
        timestamp: p.timestamp,
        type: p.anomalyType!,
        severity: p.severity!,
        description: `Suspicious activity detected from ${p.sourceIp}`,
        affectedDevice: p.destIp,
        geo: p.geo
      }));
    setAlerts(initialAlerts);
  }, []);

  // Live Traffic Simulation
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      const newPacket = generatePacket(`p-${Date.now()}`);
      setTraffic(prev => {
        const updated = [newPacket, ...prev].slice(0, 50);
        return updated;
      });

      if (newPacket.isAnomaly) {
        const newAlert: AnomalyAlert = {
          id: `a-${newPacket.id}`,
          timestamp: newPacket.timestamp,
          type: newPacket.anomalyType!,
          severity: newPacket.severity!,
          description: `Anomaly detected: ${newPacket.anomalyType}`,
          affectedDevice: newPacket.destIp,
          geo: newPacket.geo
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        setStats(prev => ({
          ...prev,
          totalPackets: prev.totalPackets + 1,
          anomaliesDetected: prev.anomaliesDetected + 1
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalPackets: prev.totalPackets + 1
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCapturing]);

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await geminiService.analyzeThreat(alerts, traffic);
    setAiAnalysis(result);
    setIsAnalyzing(false);
    setActiveView(DashboardView.AI_INSIGHTS);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: DashboardView, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${
        activeView === view 
          ? 'bg-blue-600/20 text-blue-400 border-r-4 border-blue-500' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col bg-[#0f172a] z-10">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">NADS</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">Network Anomaly Detection</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem view={DashboardView.OVERVIEW} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={DashboardView.TRAFFIC} icon={Activity} label="Live Traffic" />
            <NavItem view={DashboardView.ALERTS} icon={AlertTriangle} label="Security Alerts" />
            <NavItem view={DashboardView.THREAT_MAP} icon={Globe} label="Threat Map" />
            <NavItem view={DashboardView.PROJECT_INFO} icon={Info} label="Project Context" />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <button 
            onClick={runAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Insights'}</span>
          </button>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Capture Engine</span>
              <div className={`h-2 w-2 rounded-full ${isCapturing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            </div>
            <button 
              onClick={() => setIsCapturing(!isCapturing)}
              className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300"
            >
              {isCapturing ? 'Stop Engine' : 'Start Engine'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0f172a]/80 backdrop-blur-md">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search assets, logs, or threats..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-400">Precision:</span>
              <span className="text-xs font-bold text-emerald-400">{ (stats.precision * 100).toFixed(1) }%</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
                {alerts.length > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-[#0f172a]" />}
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#0b1222]">
          {activeView === DashboardView.OVERVIEW && <Overview stats={stats} traffic={traffic} alerts={alerts} />}
          {activeView === DashboardView.TRAFFIC && <TrafficTable traffic={traffic} />}
          {activeView === DashboardView.ALERTS && <AlertsFeed alerts={alerts} />}
          {activeView === DashboardView.THREAT_MAP && <ThreatMap alerts={alerts} />}
          {activeView === DashboardView.PROJECT_INFO && <ProjectContext />}
          {activeView === DashboardView.AI_INSIGHTS && <AiReport report={aiAnalysis} isLoading={isAnalyzing} />}
        </div>
      </main>
    </div>
  );
};

// --- Sub-components ---

const ThreatMap: React.FC<{ alerts: AnomalyAlert[] }> = ({ alerts }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // Filter and Sort State
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Derived Options
  const countries = useMemo(() => ['All', ...Array.from(new Set(alerts.map(a => a.geo?.country).filter(Boolean)))], [alerts]);
  const types = useMemo(() => ['All', ...Array.from(new Set(alerts.map(a => a.type)))], [alerts]);

  const filteredAlerts = useMemo(() => {
    let result = alerts.filter(alert => {
      const matchSeverity = filterSeverity === 'All' || alert.severity === filterSeverity;
      const matchType = filterType === 'All' || alert.type === filterType;
      const matchCountry = filterCountry === 'All' || alert.geo?.country === filterCountry;
      return matchSeverity && matchType && matchCountry;
    });

    return result.sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a.timestamp}`).getTime();
      const timeB = new Date(`1970/01/01 ${b.timestamp}`).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [alerts, filterSeverity, filterType, filterCountry, sortOrder]);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2.5,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(leafletMap.current);

      markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    }

    if (markersLayer.current) {
      markersLayer.current.clearLayers();
      
      filteredAlerts.forEach(alert => {
        if (alert.geo) {
          const color = alert.severity === 'High' ? '#ef4444' : alert.severity === 'Medium' ? '#f59e0b' : '#3b82f6';
          const marker = L.circleMarker([alert.geo.lat, alert.geo.lng], {
            radius: alert.severity === 'High' ? 8 : 6,
            fillColor: color,
            color: color,
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6,
          }).bindPopup(`
            <div style="background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-family: Inter, sans-serif; min-width: 150px; border: 1px solid #334155;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                 <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; margin-right: 8px;"></div>
                 <strong style="color: ${color}; font-size: 14px;">${alert.type}</strong>
              </div>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Severity: ${alert.severity}</div>
              <div style="font-size: 12px; margin-bottom: 2px;">Target IP: ${alert.affectedDevice}</div>
              <div style="font-size: 12px; color: #cbd5e1;">Location: ${alert.geo.country}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 8px;">${alert.timestamp}</div>
            </div>
          `, { className: 'custom-popup' });
          
          markersLayer.current?.addLayer(marker);

          if (alert.severity === 'High') {
            const pulse = L.circleMarker([alert.geo.lat, alert.geo.lng], {
                radius: 12,
                fillColor: color,
                color: color,
                weight: 0,
                opacity: 0.3,
                fillOpacity: 0.2,
            });
            markersLayer.current?.addLayer(pulse);
          }
        }
      });
    }
  }, [filteredAlerts]);

  const resetFilters = () => {
    setFilterSeverity('All');
    setFilterType('All');
    setFilterCountry('All');
    setSortOrder('desc');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Global Threat Intelligence Map</h2>
          <p className="text-sm text-slate-400">Visualizing live anomalies and their geographical points of origin</p>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center gap-2">
          <div className="flex items-center px-3 text-slate-500 border-r border-slate-800 mr-1">
            <Filter size={16} className="mr-2" />
            <span className="text-[10px] font-black uppercase">Filter</span>
          </div>

          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-800 text-[11px] font-bold text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none border border-slate-700"
          >
            <option value="All">All Severity</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 text-[11px] font-bold text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none border border-slate-700 max-w-[150px]"
          >
            {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>

          <select 
            value={filterCountry} 
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-slate-800 text-[11px] font-bold text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none border border-slate-700 max-w-[150px]"
          >
            {countries.map(c => <option key={c as string} value={c as string}>{c === 'All' ? 'All Countries' : c}</option>)}
          </select>

          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 flex items-center gap-2 border border-transparent hover:border-slate-700 transition-all"
            title="Sort by Time"
          >
            <ArrowUpDown size={14} />
          </button>

          {(filterSeverity !== 'All' || filterType !== 'All' || filterCountry !== 'All') && (
            <button 
              onClick={resetFilters}
              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
              title="Reset Filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl">
        <div ref={mapRef} className="absolute inset-0 z-0" />
        
        {/* Map Overlay Stats */}
        <div className="absolute top-6 left-6 z-[1000] space-y-3 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl w-48">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Displaying Alerts</p>
            <p className="text-2xl font-black text-white">{filteredAlerts.length}</p>
          </div>
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl w-48">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Top Vector</p>
            <p className="text-lg font-bold text-blue-400 truncate">
              {filteredAlerts.length > 0 ? filteredAlerts[0].type : 'No Alerts'}
            </p>
          </div>
        </div>

        {/* Legend / Info Sidebar within Map */}
        <div className="absolute top-6 right-6 bottom-6 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl w-64 flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase flex items-center">
              <Activity size={12} className="mr-2 text-indigo-400" /> Live Feed
            </h4>
            <span className="text-[9px] text-slate-500 font-bold uppercase">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
             {filteredAlerts.map(a => (
               <div key={a.id} className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-all cursor-default group">
                 <div className="flex items-center justify-between mb-1">
                   <span className={`w-2 h-2 rounded-full ${a.severity === 'High' ? 'bg-red-500' : a.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                   <span className="text-[9px] text-slate-500 font-mono">{a.timestamp}</span>
                 </div>
                 <div className="text-[11px] font-bold text-white leading-tight mb-1 group-hover:text-blue-400">{a.type}</div>
                 <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                   <span>{a.geo?.country || 'Unknown'}</span>
                   <span className="text-[9px] opacity-60">{a.affectedDevice}</span>
                 </div>
               </div>
             ))}
             {filteredAlerts.length === 0 && (
               <div className="text-center py-10">
                 <div className="text-slate-500 italic text-xs">No threats match current criteria</div>
                 <button onClick={resetFilters} className="text-blue-400 text-[10px] font-bold mt-2 hover:underline">Clear Filters</button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Overview: React.FC<{ stats: SystemStats, traffic: TrafficPacket[], alerts: AnomalyAlert[] }> = ({ stats, traffic, alerts }) => {
  // Chart Data
  const chartData = [...traffic].reverse().map(t => ({
    time: t.timestamp,
    size: t.byteCount,
    anomaly: t.isAnomaly ? t.byteCount : 0
  }));

  const pieData = [
    { name: 'Normal', value: stats.totalPackets - stats.anomaliesDetected },
    { name: 'Anomaly', value: stats.anomaliesDetected }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Packets" value={stats.totalPackets.toLocaleString()} icon={Activity} color="text-blue-400" />
        <StatCard title="Anomalies Detected" value={stats.anomaliesDetected.toLocaleString()} icon={AlertTriangle} color="text-amber-400" />
        <StatCard title="System Health" value={`${stats.systemHealth}%`} icon={Cpu} color="text-emerald-400" />
        <StatCard title="F1-Score" value={stats.f1Score.toFixed(3)} icon={Shield} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Real-time Traffic Volume</h3>
            <div className="flex space-x-4 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400 mr-2" /> Flow</span>
              <span className="flex items-center text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 mr-2" /> Anomaly</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="size" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSize)" strokeWidth={2} />
                <Area type="monotone" dataKey="anomaly" stroke="#ef4444" fillOpacity={1} fill="url(#colorAnomaly)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-6">Threat Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between text-xs font-semibold text-slate-400">
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> NORMAL</div>
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> ANOMALY</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Critical Alerts</h3>
          <button className="text-xs text-blue-400 font-bold hover:underline">View All History</button>
        </div>
        <div className="space-y-3">
          {alerts.slice(0, 5).map(alert => (
            <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${alert.severity === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">{alert.type}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{alert.timestamp} • Affected: {alert.affectedDevice}</div>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                alert.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {alert.severity}
              </div>
            </div>
          ))}
          {alerts.length === 0 && <div className="text-center py-8 text-slate-500 italic text-sm">No recent threats detected. Monitoring...</div>}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all hover:border-slate-700 group">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      <Icon className={`${color} group-hover:scale-110 transition-transform`} size={20} />
    </div>
    <div className="text-3xl font-black text-white">{value}</div>
  </div>
);

const TrafficTable: React.FC<{ traffic: TrafficPacket[] }> = ({ traffic }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
    <div className="p-6 border-b border-slate-800">
      <h3 className="font-bold text-lg">Packet Analysis Queue</h3>
      <p className="text-xs text-slate-500">Real-time inspection of incoming and outgoing flows</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
          <tr>
            <th className="px-6 py-4">Timestamp</th>
            <th className="px-6 py-4">Source IP</th>
            <th className="px-6 py-4">Dest IP</th>
            <th className="px-6 py-4">Protocol</th>
            <th className="px-6 py-4">Port</th>
            <th className="px-6 py-4 text-right">Size</th>
            <th className="px-6 py-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {traffic.map(p => (
            <tr key={p.id} className={`hover:bg-slate-800/30 transition-colors ${p.isAnomaly ? 'bg-red-500/5' : ''}`}>
              <td className="px-6 py-4 mono text-xs opacity-70">{p.timestamp}</td>
              <td className="px-6 py-4 font-medium">{p.sourceIp}</td>
              <td className="px-6 py-4 font-medium">{p.destIp}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  p.protocol === 'TCP' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                }`}>{p.protocol}</span>
              </td>
              <td className="px-6 py-4 text-slate-400 font-medium">{p.destPort}</td>
              <td className="px-6 py-4 text-right mono text-xs">{p.byteCount.toFixed(0)} B</td>
              <td className="px-6 py-4 text-center">
                {p.isAnomaly ? (
                  <span className="flex items-center justify-center text-red-500">
                    <AlertTriangle size={14} className="mr-1" />
                    <span className="text-[10px] font-bold">ANOMALY</span>
                  </span>
                ) : (
                  <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Secure</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AlertsFeed: React.FC<{ alerts: AnomalyAlert[] }> = ({ alerts }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-black text-white">Security Incident Feed</h3>
      <div className="flex space-x-2">
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-700">Export Logs</button>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/20">Clear Alerts</button>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
      {alerts.map(alert => (
        <div key={alert.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between group hover:border-red-900/30 transition-all">
          <div className="flex items-start space-x-4 mb-4 md:mb-0">
            <div className={`p-3 rounded-xl mt-1 ${
              alert.severity === 'High' ? 'bg-red-500/10 text-red-500' : 
              alert.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h4 className="font-black text-lg text-white">{alert.type}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  alert.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {alert.severity} SEVERITY
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2">{alert.description}</p>
              <div className="flex items-center space-x-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span className="flex items-center"><Server size={12} className="mr-1" /> {alert.affectedDevice}</span>
                <span className="flex items-center"><Activity size={12} className="mr-1" /> {alert.timestamp}</span>
              </div>
            </div>
          </div>
          <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold border border-slate-700 transition-all group-hover:bg-slate-700">
            Investigate
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ProjectContext: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-12 pb-12">
    <div className="text-center">
      <h2 className="text-3xl font-black text-white mb-4">University of Dodoma Project</h2>
      <p className="text-slate-400 max-w-2xl mx-auto">
        Network Anomaly Detection System (NADS) designed for the Department of Computer Science and Engineering. 
        Developed by Renatus, Huda, Kerry, and team.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-6 text-blue-400 flex items-center">
          <Terminal size={20} className="mr-2" /> Technical Core
        </h3>
        <ul className="space-y-4 text-sm text-slate-300">
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-blue-500 shrink-0" /> Behavioral analysis using ML techniques.</li>
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-blue-500 shrink-0" /> Three-Tier Architecture (Presentation, Application, Data).</li>
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-blue-500 shrink-0" /> Trained on NSL-KDD and CICIDS datasets.</li>
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-blue-500 shrink-0" /> Supports real-time monitoring and low-latency alerting.</li>
        </ul>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-6 text-emerald-400 flex items-center">
          <Database size={20} className="mr-2" /> Business Impact
        </h3>
        <ul className="space-y-4 text-sm text-slate-300">
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-emerald-500 shrink-0" /> Yields a positive Net Present Value (NPV).</li>
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-emerald-500 shrink-0" /> Estimated ROI: ~1,718% annually.</li>
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-emerald-500 shrink-0" /> Break-even point within ~3.3 months.</li>
          <li className="flex items-start"><ChevronRight size={16} className="mr-2 mt-1 text-emerald-500 shrink-0" /> Enhances security posture for IT infrastructures.</li>
        </ul>
      </div>
    </div>

    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
      <h3 className="text-xl font-bold mb-4">Architecture Layers</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <div className="font-bold text-blue-400 mb-2 uppercase text-xs tracking-widest">Presentation</div>
          <p className="text-xs text-slate-400">Web interface for administrators. Visual dashboards & reporting.</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <div className="font-bold text-indigo-400 mb-2 uppercase text-xs tracking-widest">Application</div>
          <p className="text-xs text-slate-400">Core processing. Machine learning models (Random Forest, K-Means).</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <div className="font-bold text-emerald-400 mb-2 uppercase text-xs tracking-widest">Data</div>
          <p className="text-xs text-slate-400">MySQL/PostgreSQL storage. Logs, historical data, and user profiles.</p>
        </div>
      </div>
    </div>
  </div>
);

const AiReport: React.FC<{ report: string, isLoading: boolean }> = ({ report, isLoading }) => (
  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-3xl p-8 mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-900/40">
          <BrainCircuit className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">AI Security Analyst</h2>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Generative Intelligence Audit</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
             <div className="h-20 w-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="text-indigo-500 animate-pulse" size={24} />
             </div>
          </div>
          <p className="text-indigo-400 font-medium italic animate-pulse">Scanning behavioral logs and correlating threat vectors...</p>
        </div>
      ) : (
        <div className="prose prose-invert prose-indigo max-w-none">
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-700 leading-relaxed text-slate-200 shadow-xl">
             {report ? (
               <div className="whitespace-pre-wrap space-y-4">
                 {report.split('\n').map((line, i) => {
                   if (line.startsWith('#')) return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2">{line.replace(/#/g, '').trim()}</h3>;
                   if (line.startsWith('*') || line.startsWith('-')) return <li key={i} className="ml-4 list-disc mb-1">{line.substring(1).trim()}</li>;
                   return <p key={i} className="mb-3">{line}</p>;
                 })}
               </div>
             ) : (
               <div className="text-center text-slate-500 py-10">No analysis available. Run "AI Insights" to begin.</div>
             )}
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-900/20 border border-emerald-500/20 p-6 rounded-2xl">
               <h4 className="font-bold text-emerald-400 mb-2 flex items-center"><Shield size={18} className="mr-2" /> Recommended Action</h4>
               <p className="text-sm text-slate-300">Quarantine detected IP range 192.168.1.0/24 and rotate session tokens for compromised admin account.</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/20 p-6 rounded-2xl">
               <h4 className="font-bold text-amber-400 mb-2 flex items-center"><Activity size={18} className="mr-2" /> Trend Observation</h4>
               <p className="text-sm text-slate-300">23% increase in SQL injection patterns compared to baseline. Probable automated reconnaissance phase.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default App;
