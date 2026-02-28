import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      logout();
      if (token) {
        // api call to invalidate token;
      }
    } catch (error) {
      console.log(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-black gradient-text tracking-tighter"
        >
          IUT CAFETERIA <span className="text-slate-300">|</span> 2026
        </Link>
        <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
          <Link
            to="/student"
            className="hover:text-indigo-600 transition-colors"
          >
            Order
          </Link>
          <Link to="/admin" className="hover:text-purple-600 transition-colors">
            Mission Control
          </Link>
          <button
            onClick={handleLogout}
            disabled={loading}
            className={`px-4 py-2 rounded-2xl  transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Logout"}
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
