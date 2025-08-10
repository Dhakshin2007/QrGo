
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Ticket, ShieldCheck, CalendarDays, QrCode } from 'lucide-react';
import { LOGO_URL } from '../constants';

const Header: React.FC = () => {
  const activeLinkClass = "bg-primary text-white";
  const inactiveLinkClass = "text-on-surface hover:bg-surface";

  return (
    <header className="bg-surface shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <ReactRouterDOM.Link to="/" className="flex items-center gap-3 text-2xl font-bold text-primary">
          {LOGO_URL ? (
            <img src={LOGO_URL} alt="QrGo Logo" className="h-8 w-auto" />
          ) : (
            <QrCode size={28} />
          )}
          <span>QrGo</span>
        </ReactRouterDOM.Link>
        <div className="flex items-center gap-2">
          <ReactRouterDOM.NavLink 
            to="/" 
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center gap-2`}
          >
            <CalendarDays size={18}/> Events
          </ReactRouterDOM.NavLink>
          <ReactRouterDOM.NavLink 
            to="/my-tickets" 
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center gap-2`}
          >
            <Ticket size={18}/> My Tickets
          </ReactRouterDOM.NavLink>
          <ReactRouterDOM.NavLink 
            to="/admin" 
            className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center gap-2`}
          >
            <ShieldCheck size={18}/> Organizer Admin
          </ReactRouterDOM.NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Header;
