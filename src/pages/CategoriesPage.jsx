// src/pages/CategoriesPage.jsx (FIXED)
import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../sanityClient';
import { PlusCircle, ArrowLeft, Trash2, Edit } from 'lucide-react';

const CategoryForm = ({ onBack, onSave, categoryToEdit }) => {
    const [formData, setFormData] = useState({ name: '', parent: '' });
    const [allCategories, setAllCategories] = useState([]);

    useEffect(() => {
        client.fetch(`*[_type == "category"]{_id, name}`)
            .then(setAllCategories).catch(console.error);
        if (categoryToEdit) {
            setFormData({ name: categoryToEdit.name || '', parent: categoryToEdit.parent?._ref || '' });
        } else {
            setFormData({ name: '', parent: '' });
        }
    }, [categoryToEdit]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const slug = formData.name.toLowerCase().replace(/\s+/g, '-').slice(0, 95);
        const doc = { _type: 'category', name: formData.name, slug: { _type: 'slug', current: slug } };
        if (formData.parent) doc.parent = { _type: 'reference', _ref: formData.parent };

        try {
            if (categoryToEdit) {
                const patch = client.patch(categoryToEdit._id).set(doc);
                if (!formData.parent) patch.unset(['parent']);
                await patch.commit();
            } else {
                await client.create(doc);
            }
            alert(`Category ${categoryToEdit ? 'updated' : 'created'} successfully!`);
            onSave();
            onBack();
        } catch (error) {
            console.error("Failed to save category:", error);
            alert('Failed to save category.');
        }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>{categoryToEdit ? 'Edit Category' : 'Add New Category'}</h2>
            </div>
            <form className="product-form" style={{gridTemplateColumns: '1fr'}} onSubmit={handleSubmit}>
                <div className="form-group"><label>Category Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Parent Category (Leave empty for Main Category)</label>
                    <select name="parent" value={formData.parent} onChange={handleChange}>
                        <option value="">-- None (This is a Main Category) --</option>
                        {allCategories.map(cat => (
                            categoryToEdit?._id !== cat._id && <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-actions"><button type="submit" className="btn-primary">Save Category</button></div>
            </form>
        </div>
    );
};

export default function CategoriesPage() {
    const [view, setView] = useState('list');
    const [categories, setCategories] = useState([]);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    const fetchCategories = useCallback(() => {
        client.fetch(`*[_type == "category"]{ ..., "parentName": parent->name } | order(name asc)`)
            .then(setCategories).catch(console.error);
    }, []);

    useEffect(fetchCategories, [fetchCategories]);

    const handleEdit = (category) => { setCategoryToEdit(category); setView('form'); };
    const handleAddNew = () => { setCategoryToEdit(null); setView('form'); };
    const handleDelete = async (categoryId) => {
        if (window.confirm('Are you sure?')) {
            await client.delete(categoryId);
            fetchCategories();
        }
    };

    if (view === 'form') return <CategoryForm onBack={() => setView('list')} onSave={fetchCategories} categoryToEdit={categoryToEdit} />;

    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Categories Management</h2>
                <button className="btn-primary" onClick={handleAddNew}><PlusCircle size={16}/> Add New Category</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Category Name</th><th>Parent Category</th><th>Actions</th></tr></thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat._id}>
                                <td>{cat.name}</td>
                                <td>{cat.parentName || '---'}</td>
                                <td className="action-buttons">
                                    <button className="btn-edit" onClick={() => handleEdit(cat)}><Edit size={16} /></button>
                                    <button className="btn-delete" onClick={() => handleDelete(cat._id)}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}