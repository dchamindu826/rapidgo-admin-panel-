// src/components/Sidebar.jsx (COMPLETE & CORRECTED)

import React from 'react';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Bell, 
    Users, 
    Shield, 
    LogOut, 
    ChevronLeft, 
    ChevronRight, 
    Shapes, 
    Package 
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout }) {
    // All your required navigation links are here
    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Products', icon: <ShoppingBag size={20} /> },
        { name: 'Delivery Requests', icon: <Bell size={20} /> }, // <-- ADDED BACK
        { name: 'Categories', icon: <Shapes size={20} /> },      // <-- ADDED BACK
        { name: 'Riders', icon: <Users size={20} /> },
        { name: 'Parcels', icon: <Package size={20} /> },
        { name: 'Admins', icon: <Shield size={20} /> },
    ];

    return(
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header"><img src="/logo.png" alt="RapidGo Logo" className="sidebar-logo" /></div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <a key={item.name} href="#" onClick={(e) => { e.preventDefault(); setActivePage(item.name); }} className={`nav-item ${activePage === item.name ? 'active' : ''}`}>
                        {item.icon}
                        {!isCollapsed && <span className="nav-text">{item.name}</span>}
                    </a>
                ))}
            </nav>
            <div className="sidebar-footer">
                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="nav-item">
                    <LogOut size={20} />
                    {!isCollapsed && <span className="nav-text">Logout</span>}
                </a>
            </div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle">
                {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
            </button>
        </aside>
    );
};