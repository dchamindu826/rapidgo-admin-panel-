import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../sanityClient';
import styles from './DeliveryRequestsPage.module.css';
import { ArrowLeft, Package, ShoppingBag, Pill, Utensils, User, MapPin, AlertTriangle } from 'lucide-react';

const OrderDetails = ({ order, onBack, onUpdate }) => {
    const [riders, setRiders] = useState([]);
    const [selectedRider, setSelectedRider] = useState(order.assignedRider?._ref || '');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        client.fetch(`*[_type == "rider"]{_id, fullName}`).then(setRiders);
    }, []);

    const handleAssign = async () => {
        if (!selectedRider) return alert('Please select a rider.');
        if (window.confirm(`Assign this order to the selected rider?`)) {
            setIsAssigning(true);
            try {
                await client.patch(order._id)
                    .set({ assignedRider: { _type: 'reference', _ref: selectedRider }, status: 'assigned' })
                    .commit();
                alert('Rider assigned successfully!');
                onUpdate();
            } catch (error) {
                console.error("Failed to assign rider:", error);
            } finally {
                setIsAssigning(false);
            }
        }
    };

    const getIcon = (type) => {
        const icons = { parcel: <Package />, grocery: <ShoppingBag />, pharmacy: <Pill />, food: <Utensils /> };
        return icons[type] || <Package />;
    };

    return (
        <div className={styles.singleViewContainer}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={onBack}><ArrowLeft size={16}/> Back to Requests</button>
                <div className={styles.title}>{getIcon(order.orderType)}<span>Request: {order.orderId}</span></div>
            </header>
            <div className={styles.detailsGrid}>
                <div className={styles.card}>
                    <h4><User size={16}/> Customer & Status</h4>
                    <div className={styles.detailItem}><strong>Name:</strong> <span>{order.customerName}</span></div>
                    <div className={styles.detailItem}><strong>Phone:</strong> <span>{order.customerPhone}</span></div>
                    <div className={styles.detailItem}><strong>Status:</strong> <span className={`${styles.statusBadge} ${styles['status-' + order.status]}`}>{order.status}</span></div>
                    {order.assignedRiderName && <div className={styles.detailItem}><strong>Assigned To:</strong> <span>{order.assignedRiderName}</span></div>}
                </div>
                <div className={styles.card}>
                    <h4><MapPin size={16}/> Pickup Details</h4>
                    <div className={styles.detailItem}><strong>Contact:</strong> <span>{order.pickupContactName}</span></div>
                    <div className={styles.detailItem}><strong>Phone:</strong> <span>{order.pickupContactPhone}</span></div>
                    <div className={styles.detailItem}><strong>Address:</strong> <span>{order.pickupAddress}</span></div>
                </div>
                <div className={styles.card}>
                    <h4><MapPin size={16}/> Delivery Details</h4>
                    <div className={styles.detailItem}><strong>Address:</strong> <span>{order.deliveryAddress}</span></div>
                    {order.destinationMapLink && <a href={order.destinationMapLink} target="_blank" rel="noopener noreferrer">View on Google Maps</a>}
                </div>
                {/* === THIS WAS THE MISSING PART === */}
                <div className={`${styles.card} ${styles.actionCard}`}>
                    <h4><AlertTriangle size={16}/> Actions</h4>
                    <div className={styles.assignGroup}>
                        <select value={selectedRider} onChange={(e) => setSelectedRider(e.target.value)} disabled={order.status !== 'pending'}>
                            <option value="" disabled>-- Select a Rider --</option>
                            {riders.map(rider => <option key={rider._id} value={rider._id}>{rider.fullName}</option>)}
                        </select>
                        <button className="btn-primary" onClick={handleAssign} disabled={isAssigning || order.status !== 'pending'}>
                            {isAssigning ? 'Assigning...' : 'Assign Rider'}
                        </button>
                    </div>
                    {order.status !== 'pending' && <p className={styles.infoText}>This order is already processed.</p>}
                </div>
            </div>
        </div>
    );
};

export default function DeliveryRequestsPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(() => {
        setLoading(true);
        const query = `*[_type == "deliveryOrder"]{ ..., "assignedRiderName": assignedRider->fullName } | order(_createdAt desc)`;
        client.fetch(query).then(data => {
            setOrders(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(fetchOrders, [fetchOrders]);
    
    if (loading) return <div className="content-box"><p style={{padding: '1.5rem'}}>Loading...</p></div>;
    if (selectedOrder) return <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} onUpdate={fetchOrders} />;

    return (
        <div className="content-box">
            <div className="content-box-header"><h2>Delivery Requests</h2></div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Order ID</th><th>Customer</th><th>Type</th><th>Status</th><th>Rider</th><th>Actions</th></tr></thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td><strong>{order.orderId}</strong></td>
                                <td>{order.customerName}</td>
                                <td>{order.orderType}</td>
                                <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                                <td>{order.assignedRiderName || 'N/A'}</td>
                                <td className="action-buttons"><button className="btn-edit" onClick={() => setSelectedOrder(order)}>Manage</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}