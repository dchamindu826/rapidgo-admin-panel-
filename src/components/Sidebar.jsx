import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';
import { 
    LayoutDashboard, ShoppingBag, Bell, Users, Shield, LogOut, 
    ChevronLeft, ChevronRight, Shapes, Package, Utensils, 
    ClipboardList, Building2, CreditCard, DollarSign, FileText, UserCog, Megaphone, TrendingUp
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsSidebarCollapsed, onLogout }) {
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    // --- 1. ALUTH STATE EKA PAYOUTS WALATA ---
    const [newPayoutAlert, setNewPayoutAlert] = useState(false);

    useEffect(() => {
        // --- ORDERS WALATA LISTENER ---
        const orderQuery = '*[_type in ["foodOrder", "deliveryOrder", "order"]]';
        const orderSubscription = client.listen(orderQuery).subscribe(update => {
            if (update.transition === 'appear' && update.result.status === 'pending') {
                setNewOrderAlert(true);
                new Audio('/notification.mp3').play().catch(e => console.log("Sound play failed"));
            }
        });

        // --- 2. PAYOUTS WALATA ALUTH LISTENER ---
        const payoutQuery = '*[_type == "withdrawalRequest"]';
        const payoutSubscription = client.listen(payoutQuery).subscribe(update => {
            if (update.transition === 'appear' && update.result.status === 'pending') {
                setNewPayoutAlert(true);
                new Audio('/notification.mp3').play().catch(e => console.log("Sound play failed"));
            }
        });

        return () => {
            orderSubscription.unsubscribe();
            payoutSubscription.unsubscribe(); // <-- 3. Unsubscribe karanna
        };
    }, []);

    const handleNavClick = (pageName) => {
        setActivePage(pageName);
        // Alert eka reset karana thana
        if (['Food Orders', 'Delivery Requests', 'Digital Orders'].includes(pageName)) {
            setNewOrderAlert(false);
        }
        // --- 4. PAYOUT ALERT EKATH RESET KARANNA ---
        if (pageName === 'Payouts') {
            setNewPayoutAlert(false);
        }
    };
    
    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Profit Report', icon: <TrendingUp size={20} /> },
        { name: 'Announcements', icon: <Megaphone size={20} /> },
        { name: 'Food Orders', icon: <ClipboardList size={20} />, alert: newOrderAlert },
        { name: 'Delivery Requests', icon: <Bell size={20} />, alert: newOrderAlert },
        { name: 'Digital Orders', icon: <CreditCard size={20} />, alert: newOrderAlert },
        { name: 'Restaurants', icon: <Building2 size={20} /> },
        { name: 'Restaurant Staff', icon: <UserCog size={20} /> },
        { name: 'Reports', icon: <FileText size={20} /> },
        { name: 'Menu Items', icon: <Utensils size={20} /> },
        { name: 'Products', icon: <ShoppingBag size={20} /> },
        { name: 'Categories', icon: <Shapes size={20} /> },
        { name: 'Riders', icon: <Users size={20} /> },
        // --- 5. ALERT EKA PAYOUTS WALATA ADD KARANNA ---
        { name: 'Payouts', icon: <DollarSign size={20} />, alert: newPayoutAlert }, 
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
                        {/* Check karanne 'item.alert' kiyala witharai */}
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