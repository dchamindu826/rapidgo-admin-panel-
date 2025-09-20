import React, { useState, useEffect, useCallback } from 'react';
import sanityClient from '../sanityClient';
import { PlusCircle, ArrowLeft } from 'lucide-react';

// === Product Form Component ===
const ProductForm = ({ onBack, onSave, productToEdit }) => {
    const [formData, setFormData] = useState({ name: '', category: '', price: '', shortDescription: '', rating: '', googleDriveLink: '', envatoMediaLink: '' });
    const [images, setImages] = useState([]);
    const [video, setVideo] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        sanityClient.fetch('*[_type == "category"]{_id, name}').then(setCategories).catch(console.error);
        if (productToEdit) {
            setFormData({
                name: productToEdit.name || '', category: productToEdit.category?._ref || '',
                price: productToEdit.price || '', shortDescription: productToEdit.shortDescription || '',
                rating: productToEdit.rating || '', googleDriveLink: productToEdit.googleDriveLink || '',
                envatoMediaLink: productToEdit.envatoMediaLink || '',
            });
        }
    }, [productToEdit]);

    // WENAS KAMA: Me functions tika component eka athulata gaththa
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.name === 'images') setImages([...e.target.files]);
        if (e.target.name === 'video') setVideo(e.target.files[0]);
    };
    
    const handleNewCategory = async () => {
        const newCategoryName = prompt("Enter new category name:");
        if (newCategoryName) {
            const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').slice(0, 95);
            const newCategoryDoc = { _type: 'category', name: newCategoryName, slug: { _type: 'slug', current: slug } };
            const createdCategory = await sanityClient.create(newCategoryDoc);
            setCategories(prev => [...prev, createdCategory]);
            setFormData(prev => ({ ...prev, category: createdCategory._id }));
            alert(`Category "${newCategoryName}" created and selected!`);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // ... (Submit logic eka kalin wage ma thiyenawa, wenasak nehe) ...
        try {
            const imageAssets = images.length > 0 ? await Promise.all(images.map(img => sanityClient.assets.upload('image', img))) : null;
            let videoAsset = video ? await sanityClient.assets.upload('file', video) : null;
            const doc = { _type: 'product', name: formData.name, slug: { _type: 'slug', current: formData.name.toLowerCase().replace(/\s+/g, '-') }, price: Number(formData.price), rating: Number(formData.rating), shortDescription: formData.shortDescription, googleDriveLink: formData.googleDriveLink, envatoMediaLink: formData.envatoMediaLink, category: { _type: 'reference', _ref: formData.category },};
            if (imageAssets) { doc.images = imageAssets.map(asset => ({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } })); }
            if (videoAsset) { doc.video = { _type: 'file', asset: { _type: 'reference', _ref: videoAsset._id } }; }
            if (productToEdit) { await sanityClient.patch(productToEdit._id).set(doc).commit(); alert('Product updated successfully!'); } 
            else { await sanityClient.create(doc); alert('Product created successfully!'); }
            onSave(); onBack();
        } catch (error) { console.error("Error saving product:", error); alert('Failed to save product.'); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16} style={{marginRight: '8px'}} /> Back to List</button>
                <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Product Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Price (Rs.)</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} required /></div>
                <div className="form-group category-group">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    <button type="button" className="btn-new-category" onClick={handleNewCategory}><PlusCircle size={16}/> New</button>
                </div>
                <div className="form-group"><label>Rating (1-5)</label><input type="number" name="rating" min="1" max="5" value={formData.rating} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Short Description</label><textarea name="shortDescription" rows="3" value={formData.shortDescription} onChange={handleInputChange}></textarea></div>
                <div className="form-group"><label>Product Images (Re-upload to change)</label><input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} /></div>
                <div className="form-group"><label>Product Video (Re-upload to change)</label><input type="file" name="video" accept="video/*" onChange={handleFileChange} /></div>
                <div className="form-group"><label>Google Drive Link</label><input type="url" name="googleDriveLink" value={formData.googleDriveLink} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Envato Preview Link</label><input type="url" name="envatoMediaLink" value={formData.envatoMediaLink} onChange={handleInputChange} /></div>
                <div className="form-actions"><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Product'}</button></div>
            </form>
        </div>
    );
};


// === Product Page (Main Component) ===
export default function ProductPage() {
    // ... Me component eke code eka kalin wage ma thiyenawa, wenasak nehe ...
    const [view, setView] = useState('list');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productToEdit, setProductToEdit] = useState(null);
    const fetchProducts = useCallback(() => { setLoading(true); sanityClient.fetch('*[_type == "product"]{ ..., "category": category->{_ref, name} }').then(data => { setProducts(data); setLoading(false); }).catch(console.error); }, []);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    const handleEdit = (product) => { setProductToEdit(product); setView('form'); };
    const handleDelete = async (productId) => { if (window.confirm('Are you sure?')) { try { await sanityClient.delete(productId); alert('Product deleted!'); fetchProducts(); } catch (error) { console.error('Error deleting:', error); alert('Failed to delete.'); } } };
    const handleAddNew = () => { setProductToEdit(null); setView('form'); };
    if (loading) return <h2>Loading products...</h2>;
    if (view === 'form') { return <ProductForm onBack={() => setView('list')} onSave={fetchProducts} productToEdit={productToEdit} />; }
    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Products Management</h2>
                <button className="btn-primary" onClick={handleAddNew}><PlusCircle size={16} style={{marginRight: '8px'}}/> Add New Product</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
                    <tbody>
                        {products.map(product => (
                        <tr key={product._id}><td>{product.name}</td><td>{product.category?.name || 'N/A'}</td><td>Rs. {product.price}</td><td className="action-buttons"><button className="btn-edit" onClick={() => handleEdit(product)}>Edit</button><button className="btn-delete" onClick={() => handleDelete(product._id)}>Delete</button></td></tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};