import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Ticket, ShieldCheck, CalendarDays } from 'lucide-react';

const Header: React.FC = () => {
  const activeLinkClass = "bg-primary text-white";
  const inactiveLinkClass = "text-on-surface hover:bg-surface";

  return (
    <header className="bg-surface shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Ticket size={28} />
          <span>Evento</span>
        </Link>
        <div className="flex items-center gap-2">
          <NavLink 
            to="/" 
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center gap-2`}
          >
            <CalendarDays size={18}/> Events
          </NavLink>
          <NavLink 
            to="/my-tickets" 
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center gap-2`}
          >
            <Ticket size={18}/> My Tickets
          </NavLink>
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center gap-2`}
          >
            <ShieldCheck size={18}/> Organizer Admin
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Header;