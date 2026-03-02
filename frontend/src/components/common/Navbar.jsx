import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [loading, setLoading] = useState(false);
  const { logout, token } = useAuth(); // Assuming your context provides the token
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoading(true);
      logout();
      navigate("/");
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
          {/* --- LOGGED IN VIEW --- */}
          {token ? (
            <>
              <Link
                to="/student"
                className="hover:text-indigo-600 transition-colors"
              >
                Order
              </Link>
              <Link 
                to="/admin" 
                className="hover:text-purple-600 transition-colors"
              >
                Mission Control
              </Link>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 rounded-2xl transition-all bg-red-500 text-white shadow-lg shadow-red-100 hover:scale-105 active:scale-95 flex items-center justify-center min-w-[80px]"
              >
                {loading ? <Loader2 className="animate-spin size-4" /> : "Logout"}
              </button>
            </>
          ) : (
            /* --- LOGGED OUT VIEW --- */
            <>
              <Link
                to="/"
                className="hover:text-indigo-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-2xl transition-all bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;