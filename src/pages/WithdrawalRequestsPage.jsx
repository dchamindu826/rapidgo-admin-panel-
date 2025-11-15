import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../sanityClient';
import { CheckCircle, XCircle } from 'lucide-react';
import styles from './RiderPage.module.css'; // RiderPage CSS එකම පාවිච්චි කරමු

export default function WithdrawalRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    const fetchRequests = useCallback(() => {
        setLoading(true);
        // අදාළ rider ගේ නම සහ wallet balance එකත් ගමු
        const query = `*[_type == "withdrawalRequest"]{
            ...,
            "riderName": rider->fullName,
            "riderWallet": rider->walletBalance,
            "bank": rider->{bankName, bankBranch, bankAccount, accountName} 
        } | order(_createdAt desc)`;
        
        client.fetch(query).then(data => {
            setRequests(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(fetchRequests, [fetchRequests]);

    const handleUpdateStatus = async (requestId, newStatus, riderId, amount) => {
        const actionText = newStatus === 'completed' ? 'Approve' : 'Decline';
        if (!window.confirm(`Are you sure you want to ${actionText} this request?`)) {
            return;
        }

        setLoading(true);
        try {
            // 1. Request එකේ status එක update කරනවා
            await client.patch(requestId).set({ status: newStatus }).commit();

            // 2. Approve කලා නම්, Rider ගේ wallet balance එක අඩු කරනවා
            if (newStatus === 'completed') {
                await client.patch(riderId).dec({ walletBalance: amount }).commit();
            }
            
            alert(`Request ${actionText}d successfully!`);
            fetchRequests(); // List එක refresh කරනවා

        } catch (error) {
            console.error(`Failed to ${actionText} request:`, error);
            alert(`Error: ${error.message}. (Schema එකේ 'walletBalance' readOnly ද බලන්න)`);
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(r => r.status === activeTab);

    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Rider Withdrawal Requests</h2>
            </div>
            <div className="tabs-container">
                <button 
                    className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('pending')}>
                    Pending
                </button>
                <button 
                    className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('completed')}>
                    Completed
                </button>
                <button 
                    className={`tab-button ${activeTab === 'declined' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('declined')}>
                    Declined
                </button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Rider Name</th>
                            <th>Amount (Rs.)</th>
                            <th>Bank Details</th>
                            <th>Requested At</th>
                            {activeTab === 'pending' && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5">Loading...</td></tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No {activeTab} requests found.</td></tr>
                        ) : (
                            filteredRequests.map(req => (
                                <tr key={req._id}>
                                    <td>
                                        {req.riderName || 'N/A'}
                                        <br/>
                                        <small>Wallet: Rs. {req.riderWallet || 0}</small>
                                    </td>
                                    <td><strong>{req.amount?.toFixed(2)}</strong></td>
                                    
                                    {/* === BANK DETAILS WENAS KALA === */}
                                    <td>
                                        {req.bank?.bankName} - {req.bank?.bankBranch}
                                        <br/>
                                        <small>{req.bank?.accountName} ({req.bank?.bankAccount})</small>
                                    </td>
                                    {/* =============================== */}

                                    <td>{new Date(req._createdAt).toLocaleString()}</td>
                                    
                                    {activeTab === 'pending' && (
                                        <td className="action-buttons">
                                            <button 
                                                className={styles.approveButton}
                                                onClick={() => handleUpdateStatus(req._id, 'completed', req.rider._ref, req.amount)}
                                                disabled={loading}>
                                                <CheckCircle size={16}/> Approve
                                            </button>
                                            <button 
                                                className={styles.declineButton}
                                                onClick={() => handleUpdateStatus(req._id, 'declined', req.rider._ref, req.amount)}
                                                disabled={loading}>
                                                <XCircle size={16}/> Decline
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}