import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, ShieldAlert, BarChart3, Globe, Flame, Bomb } from "lucide-react";
import api from "../services/api";
import PageWrapper from "../components/common/PageWrapper";

const AdminUI = () => {
  const [isChaosEnabled, setIsChaosEnabled] = useState(false); // New State
  const [services, setServices] = useState([
    { name: "Gateway Service", endpoint: "/health", status: "loading", port: 5001 },
    { name: "Identity Provider", endpoint: "/api/identity/health", status: "loading", port: 5002 },
    { name: "Inventory Service", endpoint: "/api/inventory/health", status: "loading", port: 5003 },
    { name: "Kitchen Service", endpoint: "/api/kitchen/health", status: "loading", port: 5004 },
    { name: "Notification Hub", endpoint: "/api/notification/health", status: "loading", port: 5005 },
  ]);

  // Toggle Function
  const toggleChaosMode = () => {
    setIsChaosEnabled(!isChaosEnabled);
    console.log(`Chaos Mode: ${!isChaosEnabled ? "ACTIVATED" : "DEACTIVATED"}`);
    // Logic for global chaos can be added here later
  };


  // Poll Health Endpoints every 5 seconds
  useEffect(() => {
    const checkHealth = async () => {
      const updatedServices = await Promise.all(
        services.map(async (service) => {
          try {
            const res = await api.get(service.endpoint);
            return {
              ...service,
              status: res.status === 200 ? "healthy" : "unhealthy",
            };
          } catch (err) {
            return { ...service, status: "unhealthy" };
          }
        }),
      );
      setServices(updatedServices);
    };

    const interval = setInterval(checkHealth, 5000);
    checkHealth();
    return () => clearInterval(interval);
  }, []);

  const triggerChaos = async (serviceName) => {
    try {
      // Manual trigger to "kill" a service
      await api.post("/chaos/kill", { service: serviceName });
    } catch (err) {
      console.error("Chaos command failed", err);
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-8">
        
        {/* --- CHAOS TOGGLE SECTION --- */}
        <div className="bg-slate-900 rounded-4xl p-10 shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
          {/* Animated Background Glow when Chaos is ON */}
          <AnimatePresence>
            {isChaosEnabled && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 z-10">
            <div className={`p-3 rounded-2xl ${isChaosEnabled ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
               {isChaosEnabled ? <Bomb size={24} /> : <Flame size={24} />}
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isChaosEnabled ? 'text-red-500' : 'text-white'}`}>
                CHAOS ENGINE v1.0
              </h2>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">
                System Instability Simulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isChaosEnabled ? 'text-slate-500' : 'text-indigo-400'}`}>
              Safe Mode
            </span>
            {/* The Switch */}
            <button
              onClick={toggleChaosMode}
              className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${
                isChaosEnabled ? "bg-red-600" : "bg-slate-700"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className="w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: isChaosEnabled ? 32 : 0 }}
              />
            </button>
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isChaosEnabled ? 'text-red-500' : 'text-slate-500'}`}>
              Chaos Active
            </span>
          </div>
        </div>
        {/* --- END CHAOS TOGGLE SECTION --- */}

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold gradient-text">
              System Oversight
            </h1>
            <p className="text-slate-500">
              Real-time Infrastructure Monitoring
            </p>
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
              <div
                className={`w-3 h-3 rounded-full mb-4 ${service.status === "healthy" ? "bg-green-500" : service.status === "unhealthy" ? "bg-red-500" : "bg-slate-300"}`}
              />
              <h3 className="font-bold text-slate-800 text-sm">
                {service.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Port: {service.port}
              </p>

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
                <h3 className="font-bold flex items-center gap-2 mb-6 text-slate-800">
                    <BarChart3 size={18} className="text-indigo-500" />
                    Live Latency
                </h3>
                <iframe
                    src="http://localhost:3000/d-solo/ad5nwzc/iut-cafe?orgId=1&from=1772444940441&to=1772466540441&timezone=browser&panelId=panel-1&__feature.dashboardSceneSolo=true" width="450" height="400" frameborder="0"
                    className="w-full h-64 rounded-xl border-0"
                    title="Grafana Metrics"
                />
            </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-indigo-500" />
              Order Throughput
            </h3>
            <iframe
              src="http://localhost:3000/d-solo/adfthmb/iut-cafeteria-oversight?orgId=1&from=1772466309296&to=1772467209296&timezone=browser&refresh=auto&panelId=panel-1&__feature.dashboardSceneSolo=true" width="450" height="200" frameborder="0"
              className="w-full h-64 rounded-xl border-0"
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminUI;




