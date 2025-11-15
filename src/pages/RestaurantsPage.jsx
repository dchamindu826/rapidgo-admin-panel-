import React, { useState, useEffect, useCallback } from 'react';
import { client, urlFor } from '../sanityClient';
import { PlusCircle, ArrowLeft, Edit, Trash2, DollarSign } from 'lucide-react';
import styles from './FormPages.module.css';

// ==========================================================
// === Payout Modal Component ===
// ==========================================================
const PayoutModal = ({ restaurant, onClose, onPayoutSuccess }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payoutAmount = parseFloat(amount);
        if (!payoutAmount || payoutAmount <= 0) {
            return alert("Please enter a valid amount.");
        }
        
        if (!window.confirm(`Are you sure you want to log a payout of Rs. ${payoutAmount} to ${restaurant.name}?`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            await client
                .patch(restaurant._id)
                .inc({ totalPayouts: payoutAmount })
                .commit();
            
            alert('Payout logged successfully!');
            onPayoutSuccess(); 
            onClose(); 

        } catch (error) {
            console.error("Failed to log payout:", error);
            alert("Failed to log payout. Check console for errors.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Log Payout for {restaurant.name}</h2>
                        <button type="button" onClick={onClose} className="modal-close">×</button>
                    </div>
                    <div className="modal-body">
                        <p>Current Total Paid: <strong>Rs. {restaurant.totalPayouts?.toFixed(2) || '0.00'}</strong></p>
                        <div className="form-group">
                            <label>Payout Amount (Rs.)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Enter amount paid"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Logging...' : 'Log Payout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ==========================================================
// === Restaurant Form Component ===
// ==========================================================
const RestaurantForm = ({ onBack, onSave, restaurantToEdit }) => {
    const [formData, setFormData] = useState({ name: '', description: '', phone: '', addressText: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (restaurantToEdit) {
            setFormData({
                name: restaurantToEdit.name || '',
                description: restaurantToEdit.description || '',
                phone: restaurantToEdit.phone || '',
                addressText: restaurantToEdit.addressText || ''
            });
        }
    }, [restaurantToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let logoAssetRef;
            if (logoFile) {
                const uploadedAsset = await client.assets.upload('image', logoFile);
                logoAssetRef = { _type: 'image', asset: { _type: 'reference', _ref: uploadedAsset._id } };
            }
            
            const doc = {
                _type: 'restaurant',
                name: formData.name,
                description: formData.description,
                phone: formData.phone,
                addressText: formData.addressText,
                slug: { _type: 'slug', current: formData.name.toLowerCase().replace(/\s+/g, '-') },
                ...(logoAssetRef && { logo: logoAssetRef }),
            };

            if (restaurantToEdit) {
                await client.patch(restaurantToEdit._id).set(doc).commit();
            } else {
                await client.create(doc);
            }
            alert(`Restaurant ${restaurantToEdit ? 'updated' : 'created'} successfully!`);
            onSave();
            onBack();
        } catch (error) {
            console.error("Error saving restaurant:", error);
            alert('Operation failed.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>{restaurantToEdit ? 'Edit Restaurant' : 'Add New Restaurant'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Restaurant Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label>Logo Image (Optional)</label><input type="file" onChange={e => setLogoFile(e.target.files[0])} /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div className="form-group"><label>Address (Short Text, e.g. "Malabe")</label><input type="text" value={formData.addressText} onChange={e => setFormData({...formData, addressText: e.target.value})} /></div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Description</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></div>
                <div className="form-actions"><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Restaurant'}</button></div>
            </form>
        </div>
    );
};


// ==========================================================
// === Main Restaurants Page ===
// ==========================================================
export default function RestaurantsPage() {
    const [view, setView] = useState('list');
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantToEdit, setRestaurantToEdit] = useState(null);
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);

    const fetchRestaurants = useCallback(() => {
        setLoading(true);
        client.fetch(`*[_type == "restaurant"]{_id, name, logo, phone, totalPayouts} | order(name asc)`).then(data => {
            setRestaurants(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(fetchRestaurants, [fetchRestaurants]);

    const handleEdit = (restaurant) => {
        setRestaurantToEdit(restaurant);
        setView('form');
    };
    
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this restaurant?')) {
            await client.delete(id);
            alert('Restaurant deleted.');
            fetchRestaurants();
        }
    };

    const handleOpenPayoutModal = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setPayoutModalOpen(true);
    };

    if (loading) return <h2>Loading...</h2>;
    if (view === 'form') return <RestaurantForm onBack={() => setView('list')} onSave={fetchRestaurants} restaurantToEdit={restaurantToEdit} />;

    return (
        <div className="content-box">
            {payoutModalOpen && (
                <PayoutModal
                    restaurant={selectedRestaurant}
                    onClose={() => setPayoutModalOpen(false)}
                    onPayoutSuccess={fetchRestaurants}
                />
            )}

            <div className="content-box-header">
                <h2>Restaurants</h2>
                <button className="btn-primary" onClick={() => { setRestaurantToEdit(null); setView('form'); }}><PlusCircle size={16}/> Add New</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    {/* === MEKA THAMAI WENAS KALE (Comments AIN KALA) === */}
                    <thead>
                        <tr>
                            <th>Logo</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Total Paid Out</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    {/* ============================================== */}
                    <tbody>
                        {restaurants.map(r => (
                            <tr key={r._id}>
                                <td><img src={r.logo ? urlFor(r.logo).width(50).url() : 'https://placehold.co/50'} alt={r.name} className={styles.tableImage} /></td>
                                <td>{r.name}</td>
                                <td>{r.phone || 'N/A'}</td>
                                <td>Rs. {r.totalPayouts?.toFixed(2) || '0.00'}</td>
                                <td className="action-buttons">
                                    <button 
                                        className="btn-edit" 
                                        style={{color: '#22C55E'}}
                                        onClick={() => handleOpenPayoutModal(r)}>
                                        <DollarSign size={14}/> Log Payout
                                    </button>
                                    <button className="btn-edit" onClick={() => handleEdit(r)}><Edit size={14}/> Edit</button>
                                    <button className="btn-delete" onClick={() => handleDelete(r._id)}><Trash2 size={14}/> Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}