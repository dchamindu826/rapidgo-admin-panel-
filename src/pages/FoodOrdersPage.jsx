import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '../sanityClient';
import styles from './FoodOrdersPage.module.css';
import { User, MapPin, Phone, Clock, RefreshCw, CheckCircle, Truck, XCircle, Package, DollarSign } from 'lucide-react';

// --- Order Details & Rider Assignment Modal ---
const OrderDetailsModal = ({ order, onClose, onUpdate }) => {
    const [riders, setRiders] = useState([]);
    const [selectedRider, setSelectedRider] = useState(order.assignedRider?._ref || '');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        // --- FIX: Fetch ALL riders, not just 'online' ones ---
        client.fetch(`*[_type == "rider"]{_id, fullName, availability}`).then(setRiders);
    }, []);

    const handleAssign = async () => {
        if (!selectedRider) return alert('Please select a rider.');
        setIsAssigning(true);
        try {
            await client.patch(order._id)
                .set({ assignedRider: { _type: 'reference', _ref: selectedRider }, orderStatus: 'preparing' })
                .commit();
            alert('Rider assigned successfully!');
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to assign rider:", error);
            alert('Failed to assign rider.');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Assign Rider to Order</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <p><strong>Customer:</strong> {order.receiverName}</p>
                    <p><strong>Contact:</strong> {order.receiverContact}</p>
                    <div className={styles.itemList}>
                        <strong>Items from {order.restaurant?.name}:</strong>
                        <ul>{order.orderedItems?.map(oi => <li key={oi._key}>{oi.item?.name} x {oi.quantity}</li>)}</ul>
                    </div>
                    <div className={styles.assignSection}>
                        <select value={selectedRider} onChange={e => setSelectedRider(e.target.value)}>
                            <option value="">Select a Rider</option>
                            {/* Show all riders and their status for better context */}
                            {riders.map(r => 
                                <option key={r._id} value={r._id}>
                                    {r.fullName} ({r.availability || 'status unknown'})
                                </option>
                            )}
                        </select>
                        <button onClick={handleAssign} disabled={isAssigning} className="btn-primary">
                            {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Food Orders Page ---
export default function FoodOrdersPage() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('new');
    const [filterRange, setFilterRange] = useState('today');

    const fetchOrders = useCallback(() => {
        setLoading(true);
        const query = `*[_type == "foodOrder"]{..., "restaurant": restaurant->{name}, "orderedItems": orderedItems[]{..., "item": item->}, "assignedRider": assignedRider->} | order(createdAt desc)`;
        client.fetch(query).then(data => {
            setAllOrders(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        fetchOrders();
        const subscription = client.listen('*[_type == "foodOrder"]').subscribe(() => fetchOrders());
        return () => subscription.unsubscribe();
    }, [fetchOrders]);
    
    const { filteredOrders, totalIncome, totalOrders } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0,0,0,0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const ordersInDateRange = allOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            if (filterRange === 'today') return orderDate >= startOfToday;
            if (filterRange === 'week') return orderDate >= startOfWeek;
            if (filterRange === 'month') return orderDate >= startOfMonth;
            return true;
        });

        const totalIncome = ordersInDateRange.reduce((sum, order) => sum + (order.deliveryCharge || 0), 0);
        const totalOrders = ordersInDateRange.length;
        
        let ordersToShow = ordersInDateRange;
        if (activeTab === 'new') ordersToShow = ordersInDateRange.filter(o => o.orderStatus === 'pending');
        if (activeTab === 'preparing') ordersToShow = ordersInDateRange.filter(o => o.orderStatus === 'preparing');
        if (activeTab === 'active') ordersToShow = ordersInDateRange.filter(o => ['onTheWay'].includes(o.orderStatus));
        if (activeTab === 'completed') ordersToShow = ordersInDateRange.filter(o => ['completed', 'cancelled'].includes(o.orderStatus));
        
        return { filteredOrders: ordersToShow, totalIncome, totalOrders };
    }, [allOrders, filterRange, activeTab]);

    const statusIcons = {
        pending: <Clock size={14} />, preparing: <RefreshCw size={14} />, onTheWay: <Truck size={14} />,
        completed: <CheckCircle size={14} />, cancelled: <XCircle size={14} />
    };

    return (
        <div className="content-box">
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={fetchOrders} />}
            <div className="content-box-header">
                <h2>Food Orders Dashboard</h2>
            </div>
            <div className={styles.dashboard}>
                <div className={styles.filters}>
                    <button onClick={() => setFilterRange('today')} className={filterRange === 'today' ? styles.activeFilter : ''}>Today</button>
                    <button onClick={() => setFilterRange('week')} className={filterRange === 'week' ? styles.activeFilter : ''}>This Week</button>
                    <button onClick={() => setFilterRange('month')} className={filterRange === 'month' ? styles.activeFilter : ''}>This Month</button>
                </div>
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <h4><Package size={16}/> Total Orders</h4>
                        <span>{totalOrders}</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <h4><DollarSign size={16}/> Total Income (Delivery)</h4>
                        <span>Rs. {totalIncome.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div className="tabs-container">
                <button onClick={() => setActiveTab('new')} className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}>New Orders</button>
                <button onClick={() => setActiveTab('preparing')} className={`tab-button ${activeTab === 'preparing' ? 'active' : ''}`}>Preparing</button>
                <button onClick={() => setActiveTab('active')} className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}>On The Way</button>
                <button onClick={() => setActiveTab('completed')} className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}>Completed / Cancelled</button>
            </div>
            <div className={styles.orderGrid}>
                {loading ? <p>Loading...</p> : filteredOrders.map(order => (
                    <div key={order._id} className={styles.orderCard}>
                        <div className={styles.cardHeader}>
                            <strong>Order for {order.receiverName}</strong>
                            <span className={`status-badge status-${order.orderStatus}`}>{statusIcons[order.orderStatus]} {order.orderStatus}</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.detailItem}><span>From:</span> <strong>{order.restaurant?.name || 'N/A'}</strong></div>
                            <div className={styles.detailItem}><Phone size={14}/><span>{order.receiverContact}</span></div>
                            <div className={styles.detailItem}><MapPin size={14}/>
                                <a href={order.deliveryAddress} target="_blank" rel="noopener noreferrer">View Location</a>
                            </div>
                            <div className={styles.itemList}>
                                {order.orderedItems?.map(oi => <span key={oi._key} className={styles.itemBadge}>{oi.item?.name} x {oi.quantity}</span>)}
                            </div>
                        </div>
                        <div className={styles.cardFooter}>
                            <div className={styles.priceDetails}>
                                <span>Income: <strong>Rs. {order.deliveryCharge?.toFixed(2)}</strong></span>
                                <span>Total: Rs. {order.grandTotal?.toFixed(2)}</span>
                            </div>
                            {order.orderStatus === 'pending' ? (
                                <button className="btn-primary" onClick={() => setSelectedOrder(order)}><User size={14}/> Assign Rider</button>
                            ) : (
                                <span>Rider: {order.assignedRider?.fullName || 'N/A'}</span>
                            )}
                        </div>
                    </div>
                ))}
                {!loading && filteredOrders.length === 0 && <p className={styles.noOrders}>No orders found in this category for the selected period.</p>}
            </div>
        </div>
    );
}

