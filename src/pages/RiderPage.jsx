// src/pages/RiderPage.jsx (FIXED)

import React, { useState, useEffect, useCallback } from 'react';
import { client, urlFor } from '../sanityClient';
import { districts } from '../constants/districts';
import { PlusCircle, ArrowLeft, X as CloseIcon } from 'lucide-react';
import styles from './RiderPage.module.css';

// ====================================================================
// === Rider Details Modal Component (with image checks) ===
// ====================================================================
const RiderDetailModal = ({ rider, onClose }) => (
    <div className={styles.modalBackdrop} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
                <h2>{rider.fullName}</h2>
                <button onClick={onClose} className={styles.modalCloseBtn}><CloseIcon/></button>
            </div>
            <div className={styles.modalBody}>
                <div className={styles.detailGrid}>
                    <div><strong>Rider ID:</strong> {rider.riderId}</div>
                    <div><strong>Phone:</strong> {rider.phone}</div>
                    <div><strong>NIC:</strong> {rider.idNumber}</div>
                    <div><strong>Vehicle:</strong> {rider.vehicleType} ({rider.vehicleNumber})</div>
                    <div className={styles.fullWidth}><strong>Address:</strong> {rider.address}</div>
                    <div className={styles.fullWidth}><strong>Service Areas:</strong> {rider.serviceAreas?.join(', ')}</div>
                </div>
                <h4>Documents</h4>
                <div className={styles.imageGrid}>
                    {rider.idPhotos?.map((photo, index) => photo.asset && (
                        <a key={index} href={urlFor(photo).url()} target="_blank" rel="noopener noreferrer">
                            <img src={urlFor(photo).width(200).url()} alt={`ID Photo ${index + 1}`}/>
                            <span>ID Photo {index + 1}</span>
                        </a>
                    ))}
                    {rider.licensePhotos?.map((photo, index) => photo.asset && (
                        <a key={index} href={urlFor(photo).url()} target="_blank" rel="noopener noreferrer">
                            <img src={urlFor(photo).width(200).url()} alt={`License ${index + 1}`}/>
                            <span>License {index + 1}</span>
                        </a>
                    ))}
                    {rider.insuranceCard && rider.insuranceCard.asset && (
                        <a href={urlFor(rider.insuranceCard).url()} target="_blank" rel="noopener noreferrer">
                            <img src={urlFor(rider.insuranceCard).width(200).url()} alt="Insurance"/>
                            <span>Insurance</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// ====================================================================
// === Rider Form Component (Complete) ===
// ====================================================================
const RiderForm = ({ onBack, onSave, riderToEdit }) => {
    const [formData, setFormData] = useState({ fullName: '', riderId: '', idNumber: '', address: '', phone: '', vehicleType: 'Motorbike', vehicleNumber: '', username: '', password: '' });
    const [serviceAreas, setServiceAreas] = useState([]);
    const [files, setFiles] = useState({ faceImage: null, idPhotos: [], licensePhotos: [], insuranceCard: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (riderToEdit) {
            setFormData({
                fullName: riderToEdit.fullName || '', riderId: riderToEdit.riderId || '', idNumber: riderToEdit.idNumber || '',
                address: riderToEdit.address || '', phone: riderToEdit.phone || '', vehicleType: riderToEdit.vehicleType || 'Motorbike',
                vehicleNumber: riderToEdit.vehicleNumber || '', username: riderToEdit.username || '', password: '',
            });
            setServiceAreas(riderToEdit.serviceAreas || []);
        }
    }, [riderToEdit]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => {
        if (e.target.multiple) {
            setFiles({ ...files, [e.target.name]: [...e.target.files] });
        } else {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };
    const handleServiceAreaChange = (district) => {
        setServiceAreas(prev => prev.includes(district) ? prev.filter(d => d !== district) : [...prev, district]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const assetRefs = {};
            if (files.faceImage) {
                const asset = await client.assets.upload('image', files.faceImage);
                assetRefs.faceImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
            }
            if (files.insuranceCard) {
                const asset = await client.assets.upload('image', files.insuranceCard);
                assetRefs.insuranceCard = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
            }
            if (files.idPhotos.length > 0) {
                const uploadedAssets = await Promise.all(files.idPhotos.map(file => client.assets.upload('image', file)));
                assetRefs.idPhotos = uploadedAssets.map(asset => ({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } }));
            }
            if (files.licensePhotos.length > 0) {
                const uploadedAssets = await Promise.all(files.licensePhotos.map(file => client.assets.upload('image', file)));
                assetRefs.licensePhotos = uploadedAssets.map(asset => ({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } }));
            }

            const doc = {
                _type: 'rider', ...formData,
                username: { _type: 'slug', current: formData.username },
                serviceAreas: serviceAreas,
                ...assetRefs
            };
            
            if (riderToEdit && !formData.password) {
                delete doc.password;
            }

            if (riderToEdit) await client.patch(riderToEdit._id).set(doc).commit();
            else await client.create(doc);
            
            alert(`Rider ${riderToEdit ? 'updated' : 'saved'} successfully!`);
            onSave(); onBack();
        } catch (error) { console.error("Error:", error); alert('Failed to save rider.'); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="content-box">
            <div className="content-box-header">
                <button className="btn-back" onClick={onBack}><ArrowLeft size={16}/> Back</button>
                <h2>{riderToEdit ? 'Edit Rider' : 'Register New Rider'}</h2>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
                <h3 style={{gridColumn: '1 / -1'}}>Personal Information</h3>
                <div className="form-group"><label>Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Rider ID</label><input type="text" name="riderId" value={formData.riderId} onChange={handleChange} required /></div>
                <div className="form-group"><label>NIC Number</label><input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Address</label><textarea name="address" rows="2" value={formData.address} onChange={handleChange}></textarea></div>
                
                <h3 style={{gridColumn: '1 / -1'}}>Vehicle Information</h3>
                <div className="form-group"><label>Vehicle Type</label>
                    <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                        <option>Motorbike</option><option>Three-wheeler</option><option>Van</option><option>Lorry</option>
                    </select>
                </div>
                <div className="form-group"><label>Vehicle Number</label><input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} /></div>
                
                <h3 style={{gridColumn: '1 / -1'}}>Login Credentials (for Rider App)</h3>
                <div className="form-group"><label>Username</label><input type="text" name="username" value={formData.username} onChange={handleChange} required /></div>
                <div className="form-group"><label>Password</label><input type="password" name="password" placeholder={riderToEdit ? 'Leave blank to keep unchanged' : ''} value={formData.password} onChange={handleChange} /></div>
                
                <h3 style={{gridColumn: '1 / -1'}}>Documents (Upload to change)</h3>
                <div className="form-group"><label>Rider Face Image</label><input type="file" name="faceImage" onChange={handleFileChange} /></div>
                <div className="form-group"><label>ID Card Photos (Front & Back)</label><input type="file" name="idPhotos" multiple onChange={handleFileChange} /></div>
                <div className="form-group"><label>Driving License Photos</label><input type="file" name="licensePhotos" multiple onChange={handleFileChange} /></div>
                <div className="form-group"><label>Insurance Card</label><input type="file" name="insuranceCard" onChange={handleFileChange} /></div>

                <h3 style={{gridColumn: '1 / -1'}}>Assignment</h3>
                <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Service Areas (Districts)</label>
                    <div className={styles.checkboxGroup}>
                        {districts.map(d => (<label key={d}><input type="checkbox" checked={serviceAreas.includes(d)} onChange={() => handleServiceAreaChange(d)} /> {d}</label>))}
                    </div>
                </div>

                <div className="form-actions" style={{gridColumn: '1 / -1'}}><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Rider'}</button></div>
            </form>
        </div>
    );
};


// ====================================================================
// === Main Rider Page Component (Final) ===
// ====================================================================
export default function RiderPage() {
    const [view, setView] = useState('cards');
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRider, setSelectedRider] = useState(null);
    const [riderToEdit, setRiderToEdit] = useState(null);

    const fetchRiders = useCallback(() => {
        setLoading(true);
        client.fetch(`*[_type == "rider"]{..., "username": username.current} | order(fullName asc)`)
            .then(data => { setRiders(data); setLoading(false); }).catch(console.error);
    }, []);

    useEffect(() => { fetchRiders(); }, [fetchRiders]);

    const handleEdit = (rider) => { setRiderToEdit(rider); setView('form'); };
    const handleAddNew = () => { setRiderToEdit(null); setView('form'); };

    const getRiderImageUrl = (image) => {
        if (image && image.asset) {
            return urlFor(image).width(200).height(200).url();
        }
        return 'https://placehold.co/200x200/1E293B/E2E8F0?text=No+Image';
    };

    if (loading) return <h2>Loading riders...</h2>;
    if (view === 'form') return <RiderForm onBack={() => setView('cards')} onSave={fetchRiders} riderToEdit={riderToEdit} />;

    return (
        <div className="content-box">
            {selectedRider && <RiderDetailModal rider={selectedRider} onClose={() => setSelectedRider(null)} />}
            <div className="content-box-header">
                <h2>Active Riders</h2>
                <button className="btn-primary" onClick={handleAddNew}><PlusCircle size={16}/> Register New Rider</button>
            </div>
            <div className={styles.riderGrid}>
                {riders.map(rider => (
                    <div key={rider._id} className={styles.riderCard}>
                        <div className={styles.cardImage} onClick={() => setSelectedRider(rider)}>
                            <img src={getRiderImageUrl(rider.faceImage)} alt={rider.fullName} />
                        </div>
                        <div className={styles.cardContent}>
                            <h3 onClick={() => setSelectedRider(rider)}>{rider.fullName}</h3>
                            <span>ID: {rider.riderId}</span>
                            <span>Phone: {rider.phone}</span>
                            <div className={styles.cardDistricts}>
                                {rider.serviceAreas?.map(d => <span key={d} className={styles.districtBadge}>{d}</span>)}
                            </div>
                            <button className={styles.editBtn} onClick={() => handleEdit(rider)}>Edit</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}