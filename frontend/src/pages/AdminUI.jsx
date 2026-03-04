import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, ShieldAlert, BarChart3, Globe, Flame, Bomb, X, PackagePlus, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import PageWrapper from "../components/common/PageWrapper";

const AdminUI = () => {
  const [isChaosEnabled, setIsChaosEnabled] = useState(false);
  // Modal States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAmount, setStockAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [services, setServices] = useState([
    { name: "Gateway Service", endpoint: "/health", status: "loading", port: 5001 },
    { name: "Identity Provider", endpoint: "/api/identity/health", status: "loading", port: 5002 },
    { name: "Inventory Service", endpoint: "http://localhost:5003/health", status: "loading", port: 5003 },
    { name: "Kitchen Service", endpoint: "http://localhost:5004/health", status: "loading", port: 5004 },
    { name: "Notification Hub", endpoint: "http://localhost:5005/health", status: "loading", port: 5005 },
  ]);

  const toggleChaosMode = () => {
    setIsChaosEnabled(!isChaosEnabled);
  };

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
      await api.post("/chaos/kill", { service: serviceName });
    } catch (err) {
      console.error("Chaos command failed", err);
    }
  };

  // Stock Submit Handler
  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!stockAmount) return;
    
    console.log(`Incrementing stock by: ${stockAmount}`);
    setShowSuccess(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setIsStockModalOpen(false);
      setStockAmount("");
    }, 2000);
  };

  return (
    <PageWrapper>
      <div className="space-y-8 px-10 relative">
        
        {/* --- STOCK INCREMENT DIALOG (MODAL) --- */}
        <AnimatePresence>
          {isStockModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsStockModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              
              {/* Dialog Content */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <PackagePlus size={18} className="text-indigo-600" />
                    Stock Increment Dialog
                  </h3>
                  <button 
                    onClick={() => setIsStockModalOpen(false)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-8">
                  {showSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-4 space-y-3"
                    >
                      <CheckCircle2 size={48} className="text-green-500" />
                      <p className="text-green-600 font-bold">Stock Updated Successfully!</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleStockSubmit} className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Increment Amount (Integer)
                        </label>
                        <input 
                          type="number"
                          autoFocus
                          value={stockAmount}
                          onChange={(e) => setStockAmount(e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-lg"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                      >
                        Submit Increment
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- CHAOS TOGGLE SECTION --- (Unchanged) */}
        <div className="bg-slate-900 rounded-4xl p-6 shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
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

              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={() => triggerChaos(service.name)}
                  className="w-full py-2 text-xs font-bold border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Kill Service
                </button>
                
                {/* Conditional Stock Button for Inventory Service */}
                {service.name === "Inventory Service" && (
                  <button
                    onClick={() => setIsStockModalOpen(true)}
                    className="w-full py-2 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <PackagePlus size={14} />
                    Add Stock
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Metrics Section (Unchanged) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-6 text-slate-800">
                    <BarChart3 size={18} className="text-indigo-500" />
                    Live Latency
                </h3>
                <iframe
                    src="http://localhost:3000/d-solo/ad5nwzc/iut-cafe?orgId=1&from=now-15m&to=now&refresh=5s&timezone=browser&panelId=1&__feature.dashboardSceneSolo=true" width="100%" height="400" frameBorder="0"
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
              src="http://localhost:3000/d-solo/adfthmb/iut-cafeteria-oversight?orgId=1&from=now-15m&to=now&refresh=5s&timezone=browser&refresh=auto&panelId=1&__feature.dashboardSceneSolo=true" width="450" height="200" frameBorder="0"
              className="w-full h-64 rounded-xl border-0"
              title="Throughput Metrics"
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminUI;