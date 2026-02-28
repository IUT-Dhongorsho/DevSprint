import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-black gradient-text tracking-tighter">
        IUT CAFETERIA <span className="text-slate-300">|</span> 2026
      </Link>
      <div className="flex gap-6 text-sm font-bold text-slate-600">
        <Link to="/student" className="hover:text-indigo-600 transition-colors">Order</Link>
        <Link to="/admin" className="hover:text-purple-600 transition-colors">Mission Control</Link>
      </div>
    </div>
  </nav>
);

export default Navbar;