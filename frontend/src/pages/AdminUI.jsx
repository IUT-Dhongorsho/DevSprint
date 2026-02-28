import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, ShieldAlert, BarChart3, Globe } from 'lucide-react';
import api from '../services/api';
import PageWrapper from '../components/common/PageWrapper';

const AdminUI = () => {
  const [services, setServices] = useState([
    { name: 'Identity Provider', endpoint: '/auth/health', status: 'loading', port: 4001 },
    { name: 'Order Gateway', endpoint: '/health', status: 'loading', port: 4000 },
    { name: 'Stock Service', endpoint: '/stock/health', status: 'loading', port: 4002 },
    { name: 'Kitchen Service', endpoint: '/kitchen/health', status: 'loading', port: 4003 },
    { name: 'Notification Hub', endpoint: '/notifications/health', status: 'loading', port: 4004 },
  ]);

  // Poll Health Endpoints every 5 seconds
  useEffect(() => {
    const checkHealth = async () => {
      const updatedServices = await Promise.all(services.map(async (service) => {
        try {
          const res = await api.get(service.endpoint);
          return { ...service, status: res.status === 200 ? 'healthy' : 'unhealthy' };
        } catch (err) {
          return { ...service, status: 'unhealthy' };
        }
      }));
      setServices(updatedServices);
    };

    const interval = setInterval(checkHealth, 5000);
    checkHealth();
    return () => clearInterval(interval);
  }, []);

  const triggerChaos = async (serviceName) => {
    try {
      // Manual trigger to "kill" a service
      await api.post('/chaos/kill', { service: serviceName });
    } catch (err) {
      console.error("Chaos command failed", err);
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold gradient-text">System Oversight</h1>
            <p className="text-slate-500">Real-time Infrastructure Monitoring</p>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-full text-indigo-600 text-sm font-bold flex items-center gap-2">
            <Activity size={16} className="animate-pulse" />
            Live Cluster Data
          </div>
        </div>

        {/* Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service) => (
            <motion.div 
              key={service.name}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className={`w-3 h-3 rounded-full mb-4 ${service.status === 'healthy' ? 'bg-green-500' : service.status === 'unhealthy' ? 'bg-red-500' : 'bg-slate-300'}`} />
              <h3 className="font-bold text-slate-800 text-sm">{service.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Port: {service.port}</p>
              
              <button 
                onClick={() => triggerChaos(service.name)}
                className="mt-4 w-full py-2 text-xs font-bold border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                Kill Service
              </button>
            </motion.div>
          ))}
        </div>

        {/* Metrics Section: Grafana Embeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Zap size={18} className="text-yellow-500" />
              Request Latency (Global)
            </h3>
            {/* Replace URL with your local Grafana panel link */}
            <iframe 
              src="http://localhost:3000/d-solo/your-dashboard-id?panelId=1" 
              className="w-full h-64 rounded-xl border-0"
            />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-indigo-500" />
              Order Throughput
            </h3>
            <iframe 
              src="http://localhost:3000/d-solo/your-dashboard-id?panelId=2" 
              className="w-full h-64 rounded-xl border-0"
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminUI;