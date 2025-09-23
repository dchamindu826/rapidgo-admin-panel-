// src/pages/RestaurantsPage.jsx (COMPLETE WITH FORMS)
import React, { useState, useEffect, useCallback } from 'react';
import { client, urlFor } from '../sanityClient';
import { PlusCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import styles from './FormPages.module.css';

const RestaurantForm = ({ onBack, onSave, restaurantToEdit }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (restaurantToEdit) {
            setFormData({ name: restaurantToEdit.name, description: restaurantToEdit.description || '' });
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
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Description</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></div>
                <div className="form-actions"><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Restaurant'}</button></div>
            </form>
        </div>
    );
};

export default function RestaurantsPage() {
    const [view, setView] = useState('list');
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantToEdit, setRestaurantToEdit] = useState(null);

    const fetchRestaurants = useCallback(() => {
        setLoading(true);
        client.fetch(`*[_type == "restaurant"] | order(name asc)`).then(data => {
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

    if (loading) return <h2>Loading...</h2>;
    if (view === 'form') return <RestaurantForm onBack={() => setView('list')} onSave={fetchRestaurants} restaurantToEdit={restaurantToEdit} />;

    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Restaurants</h2>
                <button className="btn-primary" onClick={() => { setRestaurantToEdit(null); setView('form'); }}><PlusCircle size={16}/> Add New</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Logo</th><th>Name</th><th>Actions</th></tr></thead>
                    <tbody>
                        {restaurants.map(r => (
                            <tr key={r._id}>
                                <td><img src={r.logo ? urlFor(r.logo).width(50).url() : 'https://placehold.co/50'} alt={r.name} className={styles.tableImage} /></td>
                                <td>{r.name}</td>
                                <td className="action-buttons">
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