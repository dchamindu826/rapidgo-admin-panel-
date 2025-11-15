import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';
import styles from './ReportsPage.module.css'; // Meka api aluthen hadamu
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Pie chart eka random colors denna
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6666'];

export default function ReportsPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load all restaurants for the dropdown
    useEffect(() => {
        client.fetch(`*[_type == "restaurant"]{_id, name} | order(name asc)`).then(setRestaurants);
    }, []);

    const handleGenerateReport = async () => {
        if (!selectedRestaurant || !startDate || !endDate) {
            alert("Please select a restaurant, start date, and end date.");
            return;
        }
        setLoading(true);
        setReportData(null);

        // Date range eka set karanna
        const start = new Date(startDate).toISOString();
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // End date eke awasana winadiya wenakam
        const endISO = end.toISOString();

        const query = `
            *[_type == 'foodOrder' && 
              restaurant._ref == $restaurantId && 
              orderStatus == 'completed' &&
              createdAt >= $startDate && 
              createdAt <= $endDate
            ] {
              _id,
              createdAt,
              grandTotal,
              deliveryCharge,
              foodTotal,
              "items": orderedItems[]{
                _key,
                quantity,
                "name": item->name
              }
            }
        `;
        
        try {
            const orders = await client.fetch(query, { 
                restaurantId: selectedRestaurant, 
                startDate: start, 
                endDate: endISO 
            });

            // --- DATA ANALYSIS ---
            let totalRevenue = 0;
            let totalDeliveryFees = 0;
            let totalFoodValue = 0;
            const itemCounts = {};

            orders.forEach(order => {
                totalRevenue += order.grandTotal;
                totalDeliveryFees += order.deliveryCharge;
                totalFoodValue += order.foodTotal;

                order.items.forEach(item => {
                    itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
                });
            });

            const topItems = Object.entries(itemCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Top 10 items

            setReportData({
                totalOrders: orders.length,
                totalRevenue,
                totalDeliveryFees,
                totalFoodValue,
                topItems,
                restaurantName: restaurants.find(r => r._id === selectedRestaurant)?.name,
                period: `${startDate} to ${endDate}`
            });

        } catch (error) {
            console.error("Failed to generate report:", error);
            alert("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.reportsPage}>
            {/* --- 1. FILTERS --- */}
            <div className={`content-box ${styles.filtersBox}`}>
                <div className="content-box-header">
                    <h2>Generate Restaurant Report</h2>
                </div>
                <div className={styles.filtersBody}>
                    <div className="form-group">
                        <label>Select Restaurant</label>
                        <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}>
                            <option value="" disabled>-- Select Restaurant --</option>
                            {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <button className="btn-primary" onClick={handleGenerateReport} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {/* --- 2. REPORT DISPLAY --- */}
            {loading && <p className={styles.loadingText}>Loading report...</p>}
            
            {reportData && (
                <div className={`content-box ${styles.reportContainer}`}>
                    <div className="content-box-header">
                        <h2>Report for {reportData.restaurantName}</h2>
                        <span>{reportData.period}</span>
                    </div>

                    {/* --- Summary Cards --- */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <span>Total Orders</span>
                            <strong>{reportData.totalOrders}</strong>
                        </div>
                        <div className={styles.summaryCard}>
                            <span>Total Revenue</span>
                            <strong>Rs. {reportData.totalRevenue.toFixed(2)}</strong>
                        </div>
                        <div className={styles.summaryCard}>
                            <span>Total Food Value</span>
                            <strong>Rs. {reportData.totalFoodValue.toFixed(2)}</strong>
                        </div>
                        <div className={styles.summaryCard}>
                            <span>Admin Delivery Fees</span>
                            <strong>Rs. {reportData.totalDeliveryFees.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* --- Charts --- */}
                    <div className={styles.chartsGrid}>
                        <div className={styles.chartBox}>
                            <h3>Revenue Breakdown</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie dataKey="value" 
                                         data={[{name: 'Food Value', value: reportData.totalFoodValue}, {name: 'Delivery Fees', value: reportData.totalDeliveryFees}]} 
                                         cx="50%" cy="50%" 
                                         outerRadius={100} 
                                         label={(entry) => `Rs. ${entry.value.toFixed(0)}`}>
                                        <Cell fill={COLORS[0]} />
                                        <Cell fill={COLORS[1]} />
                                    </Pie>
                                    <Tooltip formatter={(value) => `Rs. ${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className={styles.chartBox}>
                            <h3>Top 10 Selling Items</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.topItems} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={120} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill={COLORS[2]} name="Units Sold" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}