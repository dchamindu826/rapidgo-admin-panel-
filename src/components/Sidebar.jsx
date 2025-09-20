import React from 'react';
import { LayoutDashboard, ShoppingBag, ListOrdered, Users, Package, LogOut, ChevronLeft, ChevronRight, Zap, Shield } from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout }) {
    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Products', icon: <ShoppingBag size={20} /> },
        { name: 'Orders', icon: <ListOrdered size={20} /> },
        { name: 'Riders', icon: <Users size={20} /> },
        { name: 'Parcels', icon: <Package size={20} /> },
        { name: 'Admins', icon: <Shield size={20} /> }, // Aluth link eka
    ];
    return(
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {/* WENAS KAMA: Icon eka wenuwata logo eka demma */}
                <img src="/logo.png" alt="RapidGo Logo" className="sidebar-logo" />
                {!isCollapsed && <span className="logo-text"></span>}
            </div>
            <nav className="sidebar-nav">{navItems.map(item => (<a key={item.name} href="#" onClick={(e) => { e.preventDefault(); setActivePage(item.name); }} className={`nav-item ${activePage === item.name ? 'active' : ''}`}>{item.icon}{!isCollapsed && <span className="nav-text">{item.name}</span>}</a>))}</nav>
            <div className="sidebar-footer"><a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="nav-item"><LogOut size={20} />{!isCollapsed && <span className="nav-text">Logout</span>}</a></div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle">{isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>
        </aside>
    );
};