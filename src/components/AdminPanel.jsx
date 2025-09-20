import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css'; 
import sanityClient from '../sanityClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, ShoppingBag, ListOrdered, Users, Package, LogOut, ChevronLeft, ChevronRight, Zap, PlusCircle, ArrowLeft } from 'lucide-react';

// === Main App Component ===
export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return isLoggedIn ? <MainLayout /> : <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}

// === Main Layout ===
const MainLayout = () => {
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    return (
        <div className="admin-layout">
            <Sidebar activePage={activePage} setActivePage={setActivePage} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
            <div className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <Header title={activePage} />
                <main className="page-content"><PageContent activePage={activePage} /></main>
            </div>
        </div>
    );
};

// --- Page Content Router ---
const PageContent = ({ activePage }) => {
    switch (activePage) {
        case 'Dashboard': return <DashboardPage />;
        case 'Products': return <ProductPage />;
        case 'Orders': return <h2>Orders Management Coming Soon</h2>;
        case 'Riders': return <h2>Riders Management Coming Soon</h2>;
        case 'Parcels': return <h2>Parcels Management Coming Soon</h2>;
        default: return <DashboardPage />;
    }
};

// === NEW & IMPROVED: Product Page ===
const ProductPage = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    sanityClient.fetch('*[_type == "product"]{ _id, name, "category": category->name, price }')
      .then(data => {
        setProducts(data);
        setLoading(false);
      }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <h2>Loading products...</h2>;

  if (view === 'form') {
    return <ProductForm onBack={() => setView('list')} onSave={fetchProducts} />;
  }

  return (
    <div className="content-box">
      <div className="content-box-header">
        <h2>Products Management</h2>
        <button className="btn-primary" onClick={() => setView('form')}>
          <PlusCircle size={16} style={{marginRight: '8px'}}/> Add New Product
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody>
            {products.length > 0 ? products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td><td>{product.category || 'N/A'}</td><td>Rs. {product.price}</td>
                <td className="action-buttons"><button className="btn-edit">Edit</button><button className="btn-delete">Delete</button></td>
              </tr>
            )) : (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// === NEW: Product Form Component ===
const ProductForm = ({ onBack, onSave }) => {
    const [formData, setFormData] = useState({ name: '', category: '', price: '', shortDescription: '', rating: '', googleDriveLink: '', envatoMediaLink: '' });
    const [images, setImages] = useState([]);
    const [video, setVideo] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch categories on component mount
    useEffect(() => {
        sanityClient.fetch('*[_type == "category"]{_id, name}').then(setCategories).catch(console.error);
    }, []);

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
            const newCategoryDoc = { _type: 'category', name: newCategoryName, slug: { _type: 'slug', current: newCategoryName.toLowerCase().replace(/\s+/g, '-') } };
            const createdCategory = await sanityClient.create(newCategoryDoc);
            setCategories(prev => [...prev, createdCategory]);
            setFormData(prev => ({ ...prev, category: createdCategory._id }));
            alert(`Category "${newCategoryName}" created and selected!`);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Upload assets (images and video)
            const imageAssets = await Promise.all(images.map(img => sanityClient.assets.upload('image', img)));
            let videoAsset = null;
            if (video) {
                videoAsset = await sanityClient.assets.upload('file', video);
            }

            // 2. Prepare the product document
            const productDoc = {
                _type: 'product',
                name: formData.name,
                slug: { _type: 'slug', current: formData.name.toLowerCase().replace(/\s+/g, '-') },
                price: Number(formData.price),
                rating: Number(formData.rating),
                shortDescription: formData.shortDescription,
                googleDriveLink: formData.googleDriveLink,
                envatoMediaLink: formData.envatoMediaLink,
                category: { _type: 'reference', _ref: formData.category },
                images: imageAssets.map(asset => ({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } })),
            };
            if (videoAsset) {
                productDoc.video = { _type: 'file', asset: { _type: 'reference', _ref: videoAsset._id } };
            }

            // 3. Create the document in Sanity
            await sanityClient.create(productDoc);
            alert('Product created successfully!');
            onSave(); // Refetch products in the list view
            onBack(); // Go back to the list view

        } catch (error) {
            console.error("Error creating product:", error);
            alert('Failed to create product. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16} style={{marginRight: '8px'}} /> Back to List</button>
                <h2>Add New Product</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Product Name</label><input type="text" name="name" onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Price</label><input type="number" name="price" onChange={handleInputChange} required /></div>
                <div className="form-group category-group">
                    <label>Category</label>
                    <select name="category" onChange={handleInputChange} required value={formData.category}>
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    <button type="button" className="btn-new-category" onClick={handleNewCategory}><PlusCircle size={16}/> New</button>
                </div>
                <div className="form-group"><label>Rating (1-5)</label><input type="number" name="rating" min="1" max="5" onChange={handleInputChange} /></div>
                <div className="form-group"><label>Short Description</label><textarea name="shortDescription" rows="3" onChange={handleInputChange}></textarea></div>
                <div className="form-group"><label>Product Images (1-3 files)</label><input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} required /></div>
                <div className="form-group"><label>Optional Product Video</label><input type="file" name="video" accept="video/*" onChange={handleFileChange} /></div>
                <div className="form-group"><label>Google Drive Link (Downloadable)</label><input type="url" name="googleDriveLink" onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Envato Preview Link (Optional)</label><input type="url" name="envatoMediaLink" onChange={handleInputChange} /></div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// === Other components (No changes) ===
const DashboardPage = () => { /* ... same as before ... */ };
const LoginPage = ({ onLogin }) => { /* ... same as before ... */ };
const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed }) => { /* ... same as before ... */ };
const Header = ({ title }) => { /* ... same as before ... */ };
// --- Make sure to copy the unchanged components from the previous response ---

// (I've removed the duplicate code for Dashboard, Login, etc. for brevity. 
//  Please use the full components from the previous message for those.)