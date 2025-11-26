// src/App.jsx (Admin Panel)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Admin.css';
import { LogOut, User } from 'lucide-react';
import { client } from './sanityClient'; // client import එක එකතු කළා

// Import Pages & Components
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import DeliveryRequestsPage from './pages/DeliveryRequestsPage';
import CategoriesPage from './pages/CategoriesPage';
import RiderPage from './pages/RiderPage';
import AdminPage from './pages/AdminPage';
import ParcelPage from './pages/ParcelPage';
import DigitalOrdersPage from './pages/DigitalOrdersPage';
import FoodOrdersPage from './pages/FoodOrdersPage';
import RestaurantsPage from './pages/RestaurantsPage';
import MenuItemsPage from './pages/MenuItemsPage';
import WithdrawalRequestsPage from './pages/WithdrawalRequestsPage';
import ReportsPage from './pages/ReportsPage';
import RestaurantStaffPage from './pages/RestaurantStaffPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfitReportPage from './pages/ProfitReportPage';

// --- Header Component ---
const Header = ({ title, onLogout, admin }) => (
    <header className="main-header">
        <h1>{title}</h1>
        <div className="logout-group">
            <div className="admin-info">
                <User size={16} /> 
                <span>{admin?.fullName || 'Admin'} ({admin?.role || 'N/A'})</span>
            </div>
            <button className="btn-logout" onClick={onLogout}>
                <LogOut size={18} />
                <span>Logout</span>
            </button>
        </div>
    </header>
);

const PageRenderer = ({ pageName }) => {
    switch (pageName) {
        case 'Dashboard': return <DashboardPage />;
        case 'Profit Report': return <ProfitReportPage />;
        case 'Products': return <ProductPage />;
        case 'Delivery Requests': return <DeliveryRequestsPage />;
        case 'Categories': return <CategoriesPage />;
        case 'Riders': return <RiderPage />;
        case 'Payouts': return <WithdrawalRequestsPage />;
        case 'Parcels': return <ParcelPage />;
        case 'Admins': return <AdminPage />;
        case 'Digital Orders': return <DigitalOrdersPage />;
        case 'Food Orders': return <FoodOrdersPage />;
        case 'Restaurants': return <RestaurantsPage />;
        case 'Menu Items': return <MenuItemsPage />;
        case 'Restaurant Staff': return <RestaurantStaffPage />;
        case 'Announcements': return <AnnouncementsPage />;
        case 'Reports': return <ReportsPage />;
        default: return <DashboardPage />;
    }
};

export default function App() {
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const logoutTimerId = useRef(null);

    // --- AUTO-CANCEL LOGIC (New Feature) ---
    useEffect(() => {
        // විනාඩි 20කට වඩා පරණ Pending Orders සොයා Cancel කරන Function එක
        const checkAndCancelStaleOrders = async () => {
            try {
                // 1. Pending Orders ගන්න
                const pendingOrders = await client.fetch('*[_type == "foodOrder" && orderStatus == "pending"]{_id, createdAt}');
                
                const now = new Date();
                const AUTO_CANCEL_MINUTES = 20;

                pendingOrders.forEach(async (order) => {
                    const orderTime = new Date(order.createdAt);
                    const diffInMinutes = (now - orderTime) / 1000 / 60; // විනාඩි ගණන

                    if (diffInMinutes > AUTO_CANCEL_MINUTES) {
                        console.log(`Auto-cancelling order ${order._id} due to timeout.`);
                        
                        // 2. Order එක Cancel කරන්න Patch එකක් යවන්න
                        await client.patch(order._id).set({ 
                            orderStatus: 'cancelled',
                            notes: 'Auto-cancelled: Restaurant did not respond in 20 mins.' 
                        }).commit();
                    }
                });
            } catch (error) {
                console.error("Auto-cancel check failed:", error);
            }
        };

        // Admin Panel එක Open වෙලා තියෙනකොට හැම විනාඩියකට සැරයක්ම මේක Run වෙනවා
        if (loggedInAdmin) {
            const intervalId = setInterval(checkAndCancelStaleOrders, 60000); // Every 1 minute
            checkAndCancelStaleOrders(); // Initial check
            return () => clearInterval(intervalId);
        }
    }, [loggedInAdmin]);
    // ---------------------------------------

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('adminUser');
        setLoggedInAdmin(null);
        if (logoutTimerId.current) {
            clearTimeout(logoutTimerId.current);
        }
    }, []);

    const resetTimer = useCallback(() => {
        if (logoutTimerId.current) {
            clearTimeout(logoutTimerId.current);
        }
        logoutTimerId.current = setTimeout(() => {
            alert("You have been logged out due to 5 minutes of inactivity.");
            handleLogout();
        }, 5 * 60 * 1000); // 5 minutes
    }, [handleLogout]);

    useEffect(() => {
        if (loggedInAdmin) {
            const events = ['mousemove', 'keydown', 'click', 'scroll'];
            events.forEach(event => window.addEventListener(event, resetTimer));
            resetTimer(); 
            return () => {
                events.forEach(event => window.removeEventListener(event, resetTimer));
                if (logoutTimerId.current) {
                    clearTimeout(logoutTimerId.current);
                }
            };
        }
    }, [loggedInAdmin, resetTimer]);

    useEffect(() => {
        try {
            const savedAdmin = sessionStorage.getItem('adminUser');
            if (savedAdmin) {
                setLoggedInAdmin(JSON.parse(savedAdmin));
            }
        } catch (error) {
            console.error("Failed to parse admin user", error);
            sessionStorage.removeItem('adminUser');
        }
        setIsLoading(false);
    }, []);
    
    const handleLoginSuccess = (adminData) => {
        sessionStorage.setItem('adminUser', JSON.stringify(adminData));
        setLoggedInAdmin(adminData);
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    if (!loggedInAdmin) { 
        return <LoginPage onLoginSuccess={handleLoginSuccess} />; 
    }

    return (
        <div className="admin-layout">
            <Sidebar 
                activePage={activePage} 
                setActivePage={setActivePage} 
                isCollapsed={isSidebarCollapsed} 
                setIsSidebarCollapsed={setIsSidebarCollapsed} 
            />
            <div className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <Header title={activePage} onLogout={handleLogout} admin={loggedInAdmin} />
                <main className="page-content">
                    <PageRenderer pageName={activePage} />
                </main>
            </div>
        </div>
    );
}