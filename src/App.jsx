// src/App.jsx

import React, { useState } from 'react';
import './Admin.css';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import OrderPage from './pages/OrderPage';
import RiderPage from './pages/RiderPage';
import ParcelPage from './pages/ParcelPage';
import AdminPage from './pages/AdminPage';

const Header = ({ title }) => (<header className="main-header"><h1>{title}</h1></header>);

const AdminLayout = ({ children, activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout }) => (
    <div className="admin-layout">
        <Sidebar activePage={activePage} setActivePage={setActivePage} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} onLogout={onLogout} />
        <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
            <Header title={activePage} />
            <main className="page-content">{children}</main>
        </div>
    </div>
);

const PageRenderer = ({ pageName }) => {
    switch (pageName) {
        case 'Dashboard': return <DashboardPage />;
        case 'Products': return <ProductPage />;
        case 'Orders': return <OrderPage />;
        case 'Riders': return <RiderPage />;
        case 'Parcels': return <ParcelPage />;
        case 'Admins': return <AdminPage />;
        default: return <DashboardPage />;
    }
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const handleLogout = () => { setIsLoggedIn(false); };

    if (!isLoggedIn) { return <LoginPage onLogin={() => setIsLoggedIn(true)} />; }

    return (
        <AdminLayout activePage={activePage} setActivePage={setActivePage} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} onLogout={handleLogout}>
            <PageRenderer pageName={activePage} />
        </AdminLayout>
    );
}
export default App;