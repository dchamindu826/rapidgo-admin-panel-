import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../sanityClient';
import { PlusCircle, ArrowLeft, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const getImageUrl = (imageRef) => {
    if (!imageRef?.asset?._ref) return 'https://via.placeholder.com/100';
    const ref = imageRef.asset._ref;
    const parts = ref.split('-');
    const [, assetId, dimensions, format] = parts;
    const projectId = client.config().projectId;
    const dataset = client.config().dataset;
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${format}`;
};

const ProductForm = ({ onBack, onSave, productToEdit }) => {
    const [formData, setFormData] = useState({ name: '', price: '', rating: '', shortDescription: '', googleDriveLink: '', envatoMediaLink: '' });
    const [imageFiles, setImageFiles] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        client.fetch(`*[_type == "category"]{_id, name} | order(name asc)`).then(setCategories);
        if (productToEdit) {
            setFormData({
                name: productToEdit.name || '',
                price: productToEdit.price || '',
                rating: productToEdit.rating || '',
                shortDescription: productToEdit.shortDescription || '',
                googleDriveLink: productToEdit.googleDriveLink || '',
                envatoMediaLink: productToEdit.envatoMediaLink || ''
            });
            setCategory(productToEdit.category?._ref || '');
        }
    }, [productToEdit]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => setImageFiles(Array.from(e.target.files));
    const handleVideoChange = (e) => setVideoFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let videoAsset;
            const imageAssets = await Promise.all(
                imageFiles.map(file => client.assets.upload('image', file))
            );

            if (videoFile) {
                videoAsset = await client.assets.upload('file', videoFile, { contentType: videoFile.type, filename: videoFile.name });
            }

            const doc = {
                _type: 'product',
                name: formData.name,
                slug: { _type: 'slug', current: formData.name.toLowerCase().replace(/\s+/g, '-').slice(0, 95) },
                price: parseFloat(formData.price),
                rating: parseFloat(formData.rating),
                shortDescription: formData.shortDescription,
                category: { _type: 'reference', _ref: category },
                googleDriveLink: formData.googleDriveLink,
                envatoMediaLink: formData.envatoMediaLink
            };

            if (imageAssets.length > 0) {
                doc.images = imageAssets.map(asset => ({
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    }
                }));
            }

            if (videoAsset) {
                doc.video = { _type: 'file', asset: { _type: 'reference', _ref: videoAsset._id } };
            }

            if (productToEdit) {
                await client.patch(productToEdit._id).unset(['images']).set(doc).commit();
            } else {
                await client.create(doc);
            }

            Swal.fire({
  icon: 'success',
  title: 'Successfully Created!',
  text: 'Your new product has been saved.',
  timer: 2000, // තත්පර 2කින් தானாகම මැකී යයි
  showConfirmButton: false
});
        } catch (error) {
            console.error("Failed to save product:", error);
            alert(`Failed to save product. Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Product Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Price (Rs.)</label><input type="number" name="price" value={formData.price} onChange={handleChange} required /></div>
                <div className="form-group"><label>Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} required><option value="" disabled>Select a category</option>{categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
                <div className="form-group"><label>Rating (1-5)</label><input type="number" name="rating" min="1" max="5" step="0.1" value={formData.rating} onChange={handleChange} /></div>
                <div className="form-group full-width"><label>Short Description</label><textarea name="shortDescription" rows="3" value={formData.shortDescription} onChange={handleChange}></textarea></div>
                <div className="form-group"><label>Product Images (Can select multiple)</label><input type="file" accept="image/*" onChange={handleImageChange} multiple /></div>
                <div className="form-group"><label>Product Video (Optional)</label><input type="file" accept="video/*" onChange={handleVideoChange} /></div>
                <div className="form-group"><label>Google Drive Link</label><input type="url" name="googleDriveLink" value={formData.googleDriveLink} onChange={handleChange} /></div>
                <div className="form-group"><label>Envato Preview Link</label><input type="url" name="envatoMediaLink" value={formData.envatoMediaLink} onChange={handleChange} /></div>
                <div className="form-actions"><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Product'}</button></div>
            </form>
        </div>
    );
};

export default function ProductPage() {
    const [view, setView] = useState('list');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productToEdit, setProductToEdit] = useState(null);

    const fetchProducts = useCallback(() => {
        setLoading(true);
        client.fetch(`*[_type == "product"]{ ..., "categoryName": category->name, "image": images[0] } | order(_createdAt desc)`)
            .then(data => { setLoading(false); setProducts(data); })
            .catch(console.error);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleEdit = (product) => { setProductToEdit(product); setView('form'); };
    const handleAddNew = () => { setProductToEdit(null); setView('form'); };
    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await client.delete(productId);
                alert('Product deleted!');
                fetchProducts();
            } catch (error) { console.error("Failed to delete product:", error); }
        }
    };

    if (loading) return <h2>Loading products...</h2>;
    if (view === 'form') return <ProductForm onBack={() => setView('list')} onSave={fetchProducts} productToEdit={productToEdit} />;
    
    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Products Management</h2>
                <button className="btn-primary" onClick={handleAddNew}><PlusCircle size={16} style={{marginRight: '8px'}}/> Add New Product</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Rating</th><th>Actions</th></tr></thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product._id}>
                                <td><img src={getImageUrl(product.image)} alt={product.name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} /></td>
                                <td>{product.name}</td>
                                <td>{product.categoryName || 'N/A'}</td>
                                <td>Rs. {product.price?.toFixed(2)}</td>
                                <td>{product.rating || 'N/A'}</td>
                                <td className="action-buttons">
                                    <button className="btn-edit" onClick={() => handleEdit(product)}><Edit size={16} /></button>
                                    <button className="btn-delete" onClick={() => handleDelete(product._id)}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
