import React, { useState, useEffect, useCallback, useMemo } from 'react';
import sanityClient from '../sanityClient';
import { districts } from '../constants/districts';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Pagination from '../components/Pagination';

// === Parcel Form Component ===
const ParcelForm = ({ onBack, onSave }) => {
    const [formData, setFormData] = useState({
        trackingNumber: '',
        senderName: '', senderAddress: '', senderPhone: '',
        receiverName: '', receiverAddress: '', receiverPostalCode: '',
        destinationDistrict: '', assignedRider: '', destinationLocationLink: ''
    });
    const [allRiders, setAllRiders] = useState([]);
    const [availableRiders, setAvailableRiders] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        sanityClient.fetch('*[_type == "rider"]{_id, fullName, serviceAreas}').then(setAllRiders).catch(console.error);
    }, []);

    const handleDistrictChange = (e) => {
        const selectedDistrict = e.target.value;
        setFormData({ ...formData, destinationDistrict: selectedDistrict, assignedRider: '' });
        const ridersInDistrict = allRiders.filter(rider => rider.serviceAreas?.includes(selectedDistrict));
        setAvailableRiders(ridersInDistrict);
    };
    
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const doc = {
            _type: 'parcel',
            trackingNumber: formData.trackingNumber,
            senderDetails: { name: formData.senderName, address: formData.senderAddress, phone: formData.senderPhone },
            receiverDetails: { name: formData.receiverName, address: formData.receiverAddress, postalCode: formData.receiverPostalCode },
            destinationLocationLink: formData.destinationLocationLink,
            destinationDistrict: formData.destinationDistrict,
            assignedRider: formData.assignedRider ? { _type: 'reference', _ref: formData.assignedRider } : undefined,
            status: 'Pending',
            createdAt: (new Date()).toISOString(),
        };
        try {
            await sanityClient.create(doc);
            alert('Parcel created successfully!');
            onSave();
            onBack();
        } catch (error) { console.error("Error creating parcel:", error); alert('Failed to create parcel.'); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>Add New Parcel</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Tracking Number</label><input type="text" name="trackingNumber" value={formData.trackingNumber} onChange={handleChange} required /></div>
                <hr style={{gridColumn: '1 / -1', borderTop: '1px solid var(--bg-tertiary)'}}/>
                
                <h3 style={{gridColumn: '1 / -1'}}>Sender Details</h3>
                <div className="form-group"><label>Sender Name</label><input type="text" name="senderName" value={formData.senderName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Sender Phone</label><input type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleChange} required /></div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Sender Address</label><textarea name="senderAddress" rows="2" value={formData.senderAddress} onChange={handleChange}></textarea></div>
                <hr style={{gridColumn: '1 / -1', borderTop: '1px solid var(--bg-tertiary)'}}/>
                
                <h3 style={{gridColumn: '1 / -1'}}>Receiver Details</h3>
                <div className="form-group"><label>Receiver Name</label><input type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Receiver Postal Code</label><input type="text" name="receiverPostalCode" value={formData.receiverPostalCode} onChange={handleChange} /></div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Receiver Address</label><textarea name="receiverAddress" rows="2" value={formData.receiverAddress} onChange={handleChange}></textarea></div>
                <hr style={{gridColumn: '1 / -1', borderTop: '1px solid var(--bg-tertiary)'}}/>

                <h3 style={{gridColumn: '1 / -1'}}>Destination & Assignment</h3>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Destination Location (Google Maps Link)</label><input type="url" name="destinationLocationLink" value={formData.destinationLocationLink} onChange={handleChange} placeholder="https://maps.app.goo.gl/..." /></div>
                <div className="form-group"><label>Destination District</label>
                    <select name="destinationDistrict" value={formData.destinationDistrict} onChange={handleDistrictChange} required>
                        <option value="" disabled>Select a district</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="form-group"><label>Assign Rider</label>
                    <select name="assignedRider" value={formData.assignedRider} onChange={handleChange} required disabled={formData.destinationDistrict === '' || availableRiders.length === 0}>
                        <option value="" disabled>{formData.destinationDistrict ? 'Select a rider' : 'First select a district'}</option>
                        {availableRiders.map(r => <option key={r._id} value={r._id}>{r.fullName}</option>)}
                    </select>
                </div>
                <div className="form-actions" style={{gridColumn: '1 / -1'}}><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Parcel'}</button></div>
            </form>
        </div>
    );
};

// === Main Parcel Page Component ===
export default function ParcelPage() {
    const [view, setView] = useState('list');
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchParcels = useCallback(() => {
        setLoading(true);
        sanityClient.fetch(`*[_type == "parcel"] | order(createdAt desc){ ..., "riderName": assignedRider->fullName }`)
            .then(data => { setParcels(data); setLoading(false); }).catch(console.error);
    }, []);

    useEffect(() => {
        fetchParcels();
        const subscription = sanityClient.listen(`*[_type == "parcel"]`).subscribe(() => {
            fetchParcels();
        });
        return () => subscription.unsubscribe();
    }, [fetchParcels]);
    
    const filteredParcels = useMemo(() => {
        return parcels
            .filter(p => {
                // "Pending" tab eka "In Transit" ha "On the way" pennanna
                if (activeTab === 'Pending') {
                    return ['Pending', 'In Transit', 'On the way'].includes(p.status);
                }
                return p.status === activeTab;
            })
            .filter(p => dateFilter ? new Date(p.createdAt).toLocaleDateString('en-CA') === dateFilter : true);
    }, [parcels, activeTab, dateFilter]);

    const totalPages = Math.ceil(filteredParcels.length / ITEMS_PER_PAGE);
    const currentParcels = filteredParcels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (loading) return <h2>Loading parcels...</h2>;
    if (view === 'form') return <ParcelForm onBack={() => setView('list')} onSave={fetchParcels} />;

    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Parcels Management</h2>
                <div className="filters-container">
                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    <button className="btn-secondary" onClick={() => setDateFilter('')}>Clear Date</button>
                </div>
                <button className="btn-primary" onClick={() => setView('form')}><PlusCircle size={16}/> Add New Parcel</button>
            </div>
             <div className="tabs-container">
                <button className={`tab-button ${activeTab === 'Pending' ? 'active' : ''}`} onClick={() => { setActiveTab('Pending'); setCurrentPage(1); }}>Pending</button>
                <button className={`tab-button ${activeTab === 'Delivered' ? 'active' : ''}`} onClick={() => { setActiveTab('Delivered'); setCurrentPage(1); }}>Delivered</button>
                <button className={`tab-button ${activeTab === 'Returned' ? 'active' : ''}`} onClick={() => { setActiveTab('Returned'); setCurrentPage(1); }}>Returned</button>
                <button className={`tab-button ${activeTab === 'Rescheduled' ? 'active' : ''}`} onClick={() => { setActiveTab('Rescheduled'); setCurrentPage(1); }}>Rescheduled</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Tracking #</th><th>Receiver</th><th>District</th><th>Rider</th><th>Status</th></tr></thead>
                    <tbody>
                        {currentParcels.length > 0 ? currentParcels.map(p => (
                            <tr key={p._id}>
                                <td>{p.trackingNumber}</td>
                                <td>{p.receiverDetails?.name}</td>
                                <td>{p.destinationDistrict}</td>
                                <td>{p.riderName || 'N/A'}</td>
                                <td><span className={`status-badge status-${p.status?.toLowerCase().replace(/\s+/g, '-')}`}>{p.status}</span></td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>No {activeTab} parcels found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={(page) => setCurrentPage(page)} 
            />
        </div>
    );
}