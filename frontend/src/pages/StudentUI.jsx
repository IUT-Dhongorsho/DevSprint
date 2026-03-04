import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Package, ChefHat, Bell } from "lucide-react";
import api from "../services/api";
// import socket from "../services/socket";
import PageWrapper from "../components/common/PageWrapper";
import { SSE } from "sse.js";

const StudentUI = () => {
  const [orderStatus, setOrderStatus] = useState(null); // 'pending', 'verified', 'kitchen', 'ready'
  const [loading, setLoading] = useState(false);
  // const [stockStatus, setStockStatus] = useState(null);
  const api_url = import.meta.env.VITE_API_URL || "http://localhost:5001";

  useEffect(() => {
    const handlePastOrders = async () => {
      try {
        const response = await api.get(`${api_url}/api/inventory/order/user`);
        if (response.data?.payload?.orders) {
          console.log(response.data.payload.orders);
        }
      } catch (error) {
        console.log(error);
        // alert(error.message);
      }
    };
    handlePastOrders();
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const session = new SSE(`${api_url}/api/notification/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
      });
      session.addEventListener("order-status", (msg) => {
        const data = JSON.parse(msg.data);
        console.log(data);
        setOrderStatus(data.status);
      });

      session.stream();

      return () => {
        console.log("Closing SSE connection");
        session.close();
      };
    } catch (error) {
      console.log(error);
    }
    // socket.connect();
    // // Listen for real-time updates from Notification Hub
    // socket.on('order_update', (data) => {
    //   setOrderStatus(data.status);
    // });

    // return () => socket.disconnect();
  }, []);

  const placeOrder = async () => {
    setLoading(true);
    try {
      // 1. Gateway performs Token Validation & Cache Check
      const response = await api.post(`${api_url}/api/inventory/order`);
      if (response.data?.payload?.order.status) {
        setOrderStatus(response.data.payload.order.status);
        alert(response.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Order Failed");
    } finally {
      setLoading(false);
    }

    // DUMMY ORDER
    //     setLoading(true);

    //   // 1. Simulate the "Order Sent" phase (Gateway Acknowledgement)
    //   setTimeout(() => {
    //     setLoading(false);
    //     setOrderStatus('pending');

    //     // 2. Simulate "Stock Verified" (Stock Service + Redis)
    //     setTimeout(() => {
    //       setOrderStatus('verified');

    //       // 3. Simulate "In Kitchen" (RabbitMQ Consumption)
    //       setTimeout(() => {
    //         setOrderStatus('kitchen');

    //         // 4. Simulate "Ready" (Notification Hub Push)
    //         setTimeout(() => {
    //           setOrderStatus('ready');
    //         }, 3000); // 3s cooking time

    //       }, 2000);
    //     }, 2000);
    //   }, 1000);
  };

  const steps = [
    { id: "PENDING", label: "Order Sent", icon: <Bell size={20} /> },
    {
      id: "STOCK VERIFIED",
      label: "Stock Verified",
      icon: <Package size={20} />,
    },
    { id: "IN KITCHEN", label: "In Kitchen", icon: <ChefHat size={20} /> },
    { id: "READY", label: "Ready!", icon: <CheckCircle2 size={20} /> },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold gradient-text">
            Iftar Dashboard
          </h1>
          <p className="text-slate-500 mt-2">IUT Cafeteria Digital Queue</p>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 font-bold text-2xl">
              🍝
            </div>
            <div>
              <h3 className="text-xl font-bold">Spaghetti Monolith</h3>
              <p className="text-slate-400">Signature Iftar Plate</p>
            </div>
          </div>
          <button
            onClick={placeOrder}
            disabled={loading || orderStatus}
            className={`px-8 py-4 rounded-2xl font-bold transition-all ${
              orderStatus
                ? "bg-slate-100 text-slate-400"
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : orderStatus ? (
              "Order Placed"
            ) : (
              "Order Now"
            )}
          </button>
        </div>

        {/* Real-time Status Tracker */}
        {orderStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100"
          >
            <h4 className="text-lg font-bold mb-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Order Status
            </h4>

            <div className="relative flex justify-between items-center w-full">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2" />

              {steps.map((step, index) => {
                const isCompleted =
                  steps.findIndex((s) => s.id === orderStatus) >= index;
                return (
                  <div
                    key={step.id}
                    className="relative z-10 flex flex-col items-center gap-3"
                  >
                    <motion.div
                      animate={{
                        backgroundColor: isCompleted ? "#4f46e5" : "#f8fafc",
                        scale: isCompleted ? 1.2 : 1,
                      }}
                      className={`p-3 rounded-full border-4 ${isCompleted ? "border-indigo-100 text-white" : "border-white text-slate-300 shadow-sm"}`}
                    >
                      {step.icon}
                    </motion.div>
                    <span
                      className={`text-sm font-semibold ${isCompleted ? "text-indigo-600" : "text-slate-300"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};

export default StudentUI;
