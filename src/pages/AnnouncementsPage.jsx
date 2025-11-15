import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../sanityClient';
import { PlusCircle, ArrowLeft, Trash2, Send } from 'lucide-react';

// ==========================================================
// === Announcement Form Component (Add New) ===
// ==========================================================
const AnnouncementForm = ({ onBack, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target: 'all'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const doc = {
                _type: 'announcement',
                title: formData.title,
                message: formData.message,
                target: formData.target,
                createdAt: new Date().toISOString()
            };

            await client.create(doc);
            alert('Announcement sent successfully!');
            onSave(); // List eka refresh karanna
            onBack(); // List view ekata yanna

        } catch (error) {
            console.error("Failed to send announcement:", error);
            alert("Operation failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back to List</button>
                <h2>Send New Announcement</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit} style={{gridTemplateColumns: '1fr'}}>
                <div className="form-group">
                    <label>Title / Subject</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Message Body</label>
                    <textarea name="message" rows="5" value={formData.message} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Target Audience</label>
                    <select name="target" value={formData.target} onChange={handleChange}>
                        <option value="all">All Users (Riders + Restaurants)</option>
                        <option value="riders">Riders Only</option>
                        <option value="restaurants">Restaurants Only</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : <><Send size={16}/> Send Announcement</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ==========================================================
// === Main Announcements List Page ===
// ==========================================================
export default function AnnouncementsPage() {
    const [view, setView] = useState('list');
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = useCallback(() => {
        setLoading(true);
        const query = `*[_type == "announcement"] | order(createdAt desc)`;

        client.fetch(query).then(data => {
            setAnnouncements(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(fetchAnnouncements, [fetchAnnouncements]);

    const handleDelete = async (announcementId) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await client.delete(announcementId);
                alert('Announcement deleted.');
                fetchAnnouncements();
            } catch (err) {
                alert('Failed to delete.');
            }
        }
    };

    if (loading) return <h2>Loading...</h2>;
    if (view === 'form') return <AnnouncementForm onBack={() => setView('list')} onSave={fetchAnnouncements} />;

    return (
        <div className="content-box">
            <div className="content-box-header">
                <h2>Sent Announcements</h2>
                <button className="btn-primary" onClick={() => setView('form')}>
                    <PlusCircle size={16}/> Send New
                </button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Target</th>
                            <th>Sent At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.map(item => (
                            <tr key={item._id}>
                                <td>{item.title}</td>
                                <td>{item.target}</td>
                                <td>{new Date(item.createdAt).toLocaleString()}</td>
                                <td className="action-buttons">
                                    <button className="btn-delete" onClick={() => handleDelete(item._id)}>
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