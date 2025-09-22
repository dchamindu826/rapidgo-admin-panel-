// src/App.jsx (COMPLETE & CORRECTED)

import React, { useState } from 'react';
import './Admin.css';

// Import Pages & Components
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import DeliveryRequestsPage from './pages/DeliveryRequestsPage'; // <-- IMPORTED
import CategoriesPage from './pages/CategoriesPage';             // <-- IMPORTED
import RiderPage from './pages/RiderPage';
import AdminPage from './pages/AdminPage';
import ParcelPage from './pages/ParcelPage';


// Header component
const Header = ({ title }) => (<header className="main-header"><h1>{title}</h1></header>);

// This component decides which page to show
const PageRenderer = ({ pageName }) => {
    switch (pageName) {
        case 'Dashboard': 
            return <DashboardPage />;
        case 'Products': 
            return <ProductPage />;
        case 'Delivery Requests': 
            return <DeliveryRequestsPage />; // <-- ADDED BACK
        case 'Categories': 
            return <CategoriesPage />;       // <-- ADDED BACK
        case 'Riders': 
            return <RiderPage />;
        case 'Parcels': 
            return <ParcelPage />;
        case 'Admins': 
            return <AdminPage />;
        default: 
            return <DashboardPage />;
    }
};

// Main App component
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const handleLogout = () => { setIsLoggedIn(false); };

    if (!isLoggedIn) { 
        return <LoginPage onLogin={() => setIsLoggedIn(true)} />; 
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

export default App;