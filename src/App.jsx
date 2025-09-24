import React, { useState, useEffect } from 'react';
import './Admin.css';

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

const Header = ({ title }) => (<header className="main-header"><h1>{title}</h1></header>);

const PageRenderer = ({ pageName }) => {
    switch (pageName) {
        case 'Dashboard': return <DashboardPage />;
        case 'Products': return <ProductPage />;
        case 'Delivery Requests': return <DeliveryRequestsPage />;
        case 'Categories': return <CategoriesPage />;
        case 'Riders': return <RiderPage />;
        case 'Parcels': return <ParcelPage />;
        case 'Admins': return <AdminPage />;
        case 'Digital Orders': return <DigitalOrdersPage />;
        case 'Food Orders': return <FoodOrdersPage />;
        case 'Restaurants': return <RestaurantsPage />;
        case 'Menu Items': return <MenuItemsPage />;
        default: return <DashboardPage />;
    }
};

export default function App() {
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        try {
            const savedAdmin = localStorage.getItem('adminUser');
            if (savedAdmin) {
                setLoggedInAdmin(JSON.parse(savedAdmin));
            }
        } catch (error) {
            console.error("Failed to parse admin user from localStorage", error);
            localStorage.removeItem('adminUser');
        }
        setIsLoading(false);
    }, []);
    
    const handleLoginSuccess = (adminData) => {
        localStorage.setItem('adminUser', JSON.stringify(adminData));
        setLoggedInAdmin(adminData);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        setLoggedInAdmin(null);
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
                onLogout={handleLogout} 
            />
            <div className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <Header title={activePage} />
                <main className="page-content">
                    <PageRenderer pageName={activePage} />
                </main>
            </div>
        </div>
    );
}
