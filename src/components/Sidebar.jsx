import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';
import { 
    LayoutDashboard, ShoppingBag, Bell, Users, Shield, LogOut, 
    ChevronLeft, ChevronRight, Shapes, Package, Utensils, 
    ClipboardList, Building2, CreditCard
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsSidebarCollapsed, onLogout }) {
    const [newOrderAlert, setNewOrderAlert] = useState(false);

    useEffect(() => {
        const query = '*[_type in ["foodOrder", "deliveryOrder", "order"]]';
        const subscription = client.listen(query).subscribe(update => {
            if (update.transition === 'appear') {
                setNewOrderAlert(true);
                new Audio('/notification.mp3').play().catch(e => console.log("Sound play failed"));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleNavClick = (pageName) => {
        setActivePage(pageName);
        if (['Food Orders', 'Delivery Requests', 'Digital Orders'].includes(pageName)) {
            setNewOrderAlert(false);
        }
    };
    
    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Food Orders', icon: <ClipboardList size={20} />, alert: newOrderAlert },
        { name: 'Delivery Requests', icon: <Bell size={20} />, alert: newOrderAlert },
        { name: 'Digital Orders', icon: <CreditCard size={20} />, alert: newOrderAlert },
        { name: 'Restaurants', icon: <Building2 size={20} /> },
        { name: 'Menu Items', icon: <Utensils size={20} /> },
        { name: 'Products', icon: <ShoppingBag size={20} /> },
        { name: 'Categories', icon: <Shapes size={20} /> },
        { name: 'Riders', icon: <Users size={20} /> },
        { name: 'Parcels', icon: <Package size={20} /> },
        { name: 'Admins', icon: <Shield size={20} /> },
    ];

    return(
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header"><img src="/logo.png" alt="RapidGo Logo" className="sidebar-logo" /></div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <a key={item.name} href="#" onClick={(e) => { e.preventDefault(); handleNavClick(item.name); }} className={`nav-item ${activePage === item.name ? 'active' : ''}`}>
                        {item.icon}
                        {!isCollapsed && <span className="nav-text">{item.name}</span>}
                        {item.alert && !isCollapsed && <span className="notification-dot"></span>}
                    </a>
                ))}
            </nav>
            <div className="sidebar-footer">
                 <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="nav-item">
                     <LogOut size={20} />
                     {!isCollapsed && <span className="nav-text">Logout</span>}
                 </a>
             </div>
             <button onClick={() => setIsSidebarCollapsed(!isCollapsed)} className="sidebar-toggle">
                 {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
             </button>
        </aside>
    );
};
