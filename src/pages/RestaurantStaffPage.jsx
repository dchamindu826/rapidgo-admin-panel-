import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../sanityClient';
import { PlusCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react';

// ==========================================================
// === Staff Form Component (Add / Edit) ===
// ==========================================================
const StaffForm = ({ onBack, onSave, staffToEdit }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'Staff',
        restaurant: ''
    });
    const [restaurants, setRestaurants] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get all restaurants for the dropdown
    useEffect(() => {
        client.fetch(`*[_type == "restaurant"]{_id, name} | order(name asc)`).then(setRestaurants);

        if (staffToEdit) {
            setFormData({
                email: staffToEdit.email || '',
                password: '', // Password eka edit waladi his karala thiyanne
                role: staffToEdit.role || 'Staff',
                restaurant: staffToEdit.restaurant?._ref || ''
            });
        }
    }, [staffToEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.restaurant) {
            return alert("Please select a restaurant to assign.");
        }
        setIsSubmitting(true);

        try {
            const doc = {
                _type: 'restaurantUser',
                email: formData.email,
                role: formData.role,
                restaurant: { _type: 'reference', _ref: formData.restaurant }
            };

            // Password eka type karala thibboth witharak update karanna
            if (formData.password) {
                doc.password = formData.password;
            }

            if (staffToEdit) {
                // Edit existing staff
                await client.patch(staffToEdit._id).set(doc).commit();
            } else {
                // Create new staff
                if (!formData.password) {
                    setIsSubmitting(false);
                    return alert("Please enter a password for the new staff member.");
                }
                await client.create(doc);
            }

            alert(`Restaurant Staff ${staffToEdit ? 'updated' : 'created'}!`);
            onSave();
            onBack();

        } catch (error) {
            console.error("Failed to save staff:", error);
            alert("Operation failed. Check if the email is already taken.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>{staffToEdit ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Login Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" value={formData.password} 
                           placeholder={staffToEdit ? 'Leave blank to keep unchanged' : 'Enter new password'} 
                    />
                </div>
                <div className="form-group">
                    <label>Restaurant to Manage</label>
                    <select name="restaurant" value={formData.restaurant} onChange={handleChange} required>
                        <option value="" disabled>-- Select a restaurant --</option>
                        {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="Staff">Staff (View Orders Only)</option>
                        <option value="Manager">Manager (Can Edit Menu)</option>
                        <option value="Owner">Owner (Full Access)</option>
                    </select>
                </div>
                <div className="form-actions" style={{gridColumn: '1 / -1'}}>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Staff Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ==========================================================
// === Main Staff List Page ===
// ==========================================================
export default function RestaurantStaffPage() {
    const [view, setView] = useState('list');
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffToEdit, setStaffToEdit] = useState(null);

    const fetchStaff = useCallback(() => {
        setLoading(true);
        // Staff list eka, eyala manage karana restaurant eke namath ekka ganna
        const query = `*[_type == "restaurantUser"]{
            ...,
            "restaurantName": restaurant->name
        } | order(restaurantName asc)`;
        
        client.fetch(query).then(data => {
            setStaffList(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(fetchStaff, [fetchStaff]);

    const handleEdit = (staffMember) => {
        setStaffToEdit(staffMember);
        setView('form');
    };

    const handleDelete = async (staffId) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await client.delete(staffId);
                alert('Staff member deleted.');
                fetchStaff();
            } catch (err) {
                alert('Failed to delete.');
            }
        }
    };

    if (loading) return <h2>Loading...</h2>;
    if (view === 'form') return <StaffForm onBack={() => setView('list')} onSave={fetchStaff} staffToEdit={staffToEdit} />;

    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Restaurant Staff Management</h2>
                <button className="btn-primary" onClick={() => { setStaffToEdit(null); setView('form'); }}>
                    <PlusCircle size={16}/> Add New Staff
                </button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Login Email</th>
                            <th>Restaurant Managed</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(staff => (
                            <tr key={staff._id}>
                                <td>{staff.email}</td>
                                <td>{staff.restaurantName || 'N/A'}</td>
                                <td>{staff.role}</td>
                                <td className="action-buttons">
                                    <button className="btn-edit" onClick={() => handleEdit(staff)}>
                                        <Edit size={14}/> Edit / Reset Password
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(staff._id)}>
                                        <Trash2 size={14}/> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}