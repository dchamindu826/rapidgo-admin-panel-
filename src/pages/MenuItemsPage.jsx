import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { client, urlFor } from '../sanityClient';
import { PlusCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import styles from './FormPages.module.css';

// The MenuItemForm component
const MenuItemForm = ({ onBack, onSave, itemToEdit }) => {
    const [formData, setFormData] = useState({ name: '', price: '', description: '', restaurant: '' });
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [restaurants, setRestaurants] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const fetchPrerequisites = useCallback(async () => {
        const restaurantData = await client.fetch(`*[_type == "restaurant"]{_id, name}`);
        const categoryData = await client.fetch(`*[_type == "foodCategory"] | order(title asc)`);
        setRestaurants(restaurantData);
        setAllCategories(categoryData);
    }, []);

    useEffect(() => {
        fetchPrerequisites();
        if (itemToEdit) {
            setFormData({
                name: itemToEdit.name || '',
                price: itemToEdit.price || '',
                description: itemToEdit.description || '',
                restaurant: itemToEdit.restaurant?._ref || '',
            });
            setSelectedCategories(itemToEdit.categories?.map(cat => cat._id) || []);
        }
    }, [itemToEdit, fetchPrerequisites]);
    
    const handleCategoryChange = (categoryId) => {
        setSelectedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId) 
                : [...prev, categoryId]
        );
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return alert('Please enter a category name.');
        try {
            const newCategoryDoc = {
                _type: 'foodCategory',
                title: newCategoryName,
                slug: { _type: 'slug', current: newCategoryName.toLowerCase().replace(/\s+/g, '-') }
            };
            const createdCategory = await client.create(newCategoryDoc);
            alert(`Category "${createdCategory.title}" created!`);
            fetchPrerequisites();
            setSelectedCategories(prev => [...prev, createdCategory._id]);
            setNewCategoryName('');
            setShowNewCategory(false);
        } catch (error) {
            alert("Failed to create category.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.restaurant) return alert('Please select a restaurant.');
        setIsSubmitting(true);
        try {
            let imageAssetRef;
            if (imageFile) {
                const uploadedAsset = await client.assets.upload('image', imageFile);
                imageAssetRef = { _type: 'image', asset: { _type: 'reference', _ref: uploadedAsset._id } };
            }
            
            const doc = {
                _type: 'menuItem',
                name: formData.name,
                price: Number(formData.price),
                description: formData.description,
                restaurant: { _type: 'reference', _ref: formData.restaurant },
                categories: selectedCategories.map(id => ({ _type: 'reference', _ref: id })),
                ...(imageAssetRef && { image: imageAssetRef }),
            };

            if (itemToEdit) {
                await client.patch(itemToEdit._id).set(doc).commit();
            } else {
                await client.create(doc);
            }
            alert(`Menu Item ${itemToEdit ? 'updated' : 'created'}!`);
            onSave();
            onBack();
        } catch (error) {
            alert('Operation failed.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="content-box">
             <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back</button>
                <h2>{itemToEdit ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Item Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label>Price (Rs.)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
                <div className="form-group"><label>Restaurant</label>
                    <select value={formData.restaurant} onChange={e => setFormData({...formData, restaurant: e.target.value})} required>
                        <option value="" disabled>Select a restaurant</option>
                        {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                </div>
                <div className="form-group"><label>Image (Optional)</label><input type="file" onChange={e => setImageFile(e.target.files[0])} /></div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Description</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></div>
                
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                    <div className={styles.categoryHeader}>
                        <label>Categories</label>
                        <button type="button" className={styles.addNewBtn} onClick={() => setShowNewCategory(!showNewCategory)}>
                            {showNewCategory ? 'Cancel' : '+ Add New'}
                        </button>
                    </div>

                    {showNewCategory && (
                        <div className={styles.newCategoryInputWrapper}>
                            <input 
                                type="text" 
                                placeholder="New category name..." 
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <button type="button" onClick={handleCreateCategory}>Save</button>
                        </div>
                    )}
                    
                    <div className={styles.checkboxGroup}>
                        {allCategories.map(cat => (
                            <label key={cat._id} className={styles.checkboxLabel}>
                                <input type="checkbox" checked={selectedCategories.includes(cat._id)} onChange={() => handleCategoryChange(cat._id)} />
                                {cat.title}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions"><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Item'}</button></div>
            </form>
        </div>
    );
};


// --- Main List View Component ---
export default function MenuItemsPage() {
    const [view, setView] = useState('list');
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemToEdit, setItemToEdit] = useState(null);
    
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState('all');

    const fetchItems = useCallback(() => {
        setLoading(true);
        const query = `*[_type == "menuItem"]{
            ..., 
            "restaurant": restaurant->{_id, name}, 
            "categories": categories[]->{_id, title}
        } | order(name asc)`;
        
        client.fetch(query).then(data => {
            setMenuItems(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    // Fetch restaurants for the filter dropdown
    useEffect(() => {
        fetchItems();
        client.fetch(`*[_type == "restaurant"] | order(name asc)`).then(setRestaurants);
    }, [fetchItems]);
    
    const filteredItems = useMemo(() => {
        if (selectedRestaurant === 'all') {
            return menuItems;
        }
        return menuItems.filter(item => item.restaurant?._id === selectedRestaurant);
    }, [menuItems, selectedRestaurant]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await client.delete(id);
            alert('Item deleted.');
            fetchItems();
        }
    };

    if (loading) return <h2>Loading...</h2>;
    if (view === 'form') return <MenuItemForm onBack={() => setView('list')} onSave={fetchItems} itemToEdit={itemToEdit} />;
    
    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Menu Items</h2>
                <div className={styles.filterWrapper}>
                    <select value={selectedRestaurant} onChange={e => setSelectedRestaurant(e.target.value)}>
                        <option value="all">All Restaurants</option>
                        {restaurants.map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <button className="btn-primary" onClick={() => { setItemToEdit(null); setView('form'); }}><PlusCircle size={16}/> Add New Item</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    {/* === MEKA THAMAI WENAS KALE (Comments AIN KALA) === */}
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Restaurant</th>
                            <th>Categories</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    {/* ============================================== */}
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item._id}>
                                <td><img src={item.image ? urlFor(item.image).width(50).url() : 'https://placehold.co/50'} alt={item.name} className={styles.tableImage} /></td>
                                <td>{item.name}</td>
                                <td>{item.restaurant?.name || 'N/A'}</td>
                                <td>
                                    <div className={styles.categoryCell}>
                                        {item.categories?.map(cat => <span key={cat._id} className={styles.categoryBadge}>{cat.title}</span>)}
                                    </div>
                                </td>
                                <td>Rs. {item.price?.toFixed(2)}</td>
                                <td className="action-buttons">
                                    <button className="btn-edit" onClick={() => { setItemToEdit(item); setView('form'); }}><Edit size={14}/> Edit</button>
                                    <button className="btn-delete" onClick={() => handleDelete(item._id)}><Trash2 size={14}/> Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}