// src/pages/AdminPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import sanityClient from '../sanityClient';
import { PlusCircle, ArrowLeft } from 'lucide-react';

const AdminForm = ({ onBack, onSave, adminToEdit }) => {
    const [formData, setFormData] = useState({ fullName: '', username: '', password: '', role: 'Admin' });

    useEffect(() => {
        if (adminToEdit) {
            setFormData({
                fullName: adminToEdit.fullName || '',
                username: adminToEdit.username.current || '',
                password: '', // Password eka pennanne nehe
                role: adminToEdit.role || 'Admin'
            });
        }
    }, [adminToEdit]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const doc = { 
            _type: 'adminUser', 
            fullName: formData.fullName,
            username: { _type: 'slug', current: formData.username },
            role: formData.role,
        };
        // Edit karanakota password eka type kaloth witharak update karanawa
        if (formData.password) {
            doc.password = formData.password;
        }

        try {
            if (adminToEdit) {
                await sanityClient.patch(adminToEdit._id).set(doc).commit();
            } else {
                await sanityClient.create(doc);
            }
            alert(`Admin ${adminToEdit ? 'updated' : 'created'} successfully!`);
            onSave();
            onBack();
        } catch (error) { 
            console.error("Failed to save admin:", error);
            alert('Failed to save admin.');
        }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>{adminToEdit ? 'Edit Admin' : 'Add New Admin'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group"><label>Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Username</label><input type="text" name="username" value={formData.username} onChange={handleChange} required /></div>
                <div className="form-group"><label>Password</label><input type="password" name="password" placeholder={adminToEdit ? 'Leave blank to keep unchanged' : ''} value={formData.password} onChange={handleChange} /></div>
                <div className="form-group"><label>Role</label><select name="role" value={formData.role} onChange={handleChange}><option>Admin</option><option>Super Admin</option></select></div>
                <div className="form-actions"><button type="submit" className="btn-primary">Save Admin</button></div>
            </form>
        </div>
    );
};

export default function AdminPage() {
    const [view, setView] = useState('list');
    const [admins, setAdmins] = useState([]);
    const [adminToEdit, setAdminToEdit] = useState(null);
    const fetchAdmins = useCallback(() => { sanityClient.fetch(`*[_type == "adminUser"]`).then(setAdmins); }, []);
    
    useEffect(fetchAdmins, [fetchAdmins]);
    
    const handleEdit = (admin) => { setAdminToEdit(admin); setView('form'); };
    const handleAddNew = () => { setAdminToEdit(null); setView('form'); };

    if (view === 'form') return <AdminForm onBack={() => setView('list')} onSave={fetchAdmins} adminToEdit={adminToEdit} />;
    
    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Admin Management</h2>
                <button className="btn-primary" onClick={handleAddNew}><PlusCircle size={16}/> Add New Admin</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Full Name</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin._id}>
                                <td>{admin.fullName}</td>
                                <td>{admin.username.current}</td>
                                <td>{admin.role}</td>
                                <td className="action-buttons"><button className="btn-edit" onClick={() => handleEdit(admin)}>Edit</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}