import React, { useState, useEffect, useMemo } from 'react';
import sanityClient, { urlFor } from '../sanityClient';
import Pagination from '../components/Pagination';

export default function OrderPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    
    // WENAS KAMA: Pagination state eka methana thiyenna ona
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setLoading(true);
        sanityClient.fetch(`*[_type == "order"] | order(orderedAt desc)`)
            .then(data => {
                setOrders(data);
                setLoading(false);
            }).catch(console.error);
    }, []);

    // WENAS KAMA: useMemo eken filter kirima witharak karanawa
    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => order.orderStatus === activeTab)
            .filter(order => {
                if (!dateFilter) return true;
                const orderDate = new Date(order.orderedAt).toLocaleDateString('en-CA');
                return orderDate === dateFilter;
            });
    }, [orders, activeTab, dateFilter]);

    // WENAS KAMA: Filter karapu data eken, danata adala page eka witharak gannawa
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const currentOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleUpdateStatus = async (orderId, statusToUpdate) => {
        if (window.confirm(`Are you sure you want to change the status to "${statusToUpdate}"?`)) {
            try {
                await sanityClient.patch(orderId).set({ orderStatus: statusToUpdate }).commit();
                setOrders(prevOrders => prevOrders.map(order => 
                    order._id === orderId ? { ...order, orderStatus: statusToUpdate } : order
                ));
                setSelectedOrder(null);
                alert(`Order status updated to ${statusToUpdate}.`);
            } catch (error) {
                console.error("Failed to update order status:", error);
                alert("Failed to update status.");
            }
        }
    };

    if (loading) {
        return <h2>Loading orders...</h2>;
    }

    return (
        <div className="content-box">
            {selectedOrder && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Order Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="modal-close">×</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
                            <p><strong>Amount:</strong> Rs. {selectedOrder.orderAmount.toFixed(2)}</p>
                            <p><strong>Date:</strong> {new Date(selectedOrder.orderedAt).toLocaleString()}</p>
                            <p><strong>Current Status:</strong> <span className={`status-badge status-${selectedOrder.orderStatus}`}>{selectedOrder.orderStatus}</span></p>
                            <h4>Payment Slip:</h4>
                            <a href={urlFor(selectedOrder.paymentSlip).url()} target="_blank" rel="noopener noreferrer">
                                <img src={urlFor(selectedOrder.paymentSlip).width(400).url()} alt="Payment Slip" className="payment-slip-img" />
                            </a>
                        </div>
                        <div className="modal-footer">
                            <select className="status-select" onChange={(e) => setNewStatus(e.target.value)} defaultValue={selectedOrder.orderStatus}>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="declined">Declined</option>
                            </select>
                            <button className="btn-update" onClick={() => handleUpdateStatus(selectedOrder._id, newStatus || selectedOrder.orderStatus)}>Update Status</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="content-box-header">
                <h2>Orders Management</h2>
                <div className="filters-container">
                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
            </div>
            <div className="tabs-container">
                <button className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}>Pending</button>
                <button className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}>Approved</button>
                <button className={`tab-button ${activeTab === 'declined' ? 'active' : ''}`} onClick={() => { setActiveTab('declined'); setCurrentPage(1); }}>Declined</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr><th>Customer Name</th><th>Email</th><th>Order Date</th><th>Amount</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {/* WENAS KAMA: filteredOrders neme, currentOrders pennanawa */}
                        {currentOrders.length > 0 ? currentOrders.map(order => (
                            <tr key={order._id}>
                                <td>{order.customerName}</td>
                                <td>{order.customerEmail}</td>
                                <td>{new Date(order.orderedAt).toLocaleDateString()}</td>
                                <td>Rs. {order.orderAmount.toFixed(2)}</td>
                                <td><button className="btn-view" onClick={() => setSelectedOrder(order)}>View Details</button></td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No {activeTab} orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* WENAS KAMA: Pagination component eka methanata damma */}
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={(page) => setCurrentPage(page)} 
            />
        </div>
    );
}