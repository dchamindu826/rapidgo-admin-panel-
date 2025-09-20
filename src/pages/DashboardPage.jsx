import React, { useState, useEffect, useMemo } from 'react';
// ✅ WENAS KAMA: 'sanityClient' -> 'client' widihata import kara
import client from '../sanityClient';
import { LineChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, CheckCircle, XCircle, Clock, DollarSign, ListOrdered, ShoppingBag, Truck } from 'lucide-react';
import styles from './DashboardPage.module.css';

// Helper function to filter data without mutating dates
const filterDataByTime = (data, timeFilter, dateField) => {
    const now = new Date();
    
    return data.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        
        if (timeFilter === 'daily') {
            return itemDate.toDateString() === now.toDateString();
        }
        if (timeFilter === 'weekly') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            oneWeekAgo.setHours(0,0,0,0);
            return itemDate >= oneWeekAgo;
        }
        if (timeFilter === 'monthly') {
            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        return true;
    });
};

const DashboardPage = () => {
    const [parcels, setParcels] = useState([]);
    const [orders, setOrders] = useState([]);
    const [timeFilter, setTimeFilter] = useState('monthly');

    useEffect(() => {
        const fetchAllData = async () => {
            const parcelsQuery = `*[_type == "parcel"]{status, createdAt}`;
            const ordersQuery = `*[_type == "order"]{orderAmount, orderStatus, orderedAt, items}`;
            try {
                const [parcelsData, ordersData] = await Promise.all([
                    client.fetch(parcelsQuery), client.fetch(ordersQuery)
                ]);
                setParcels(parcelsData);
                setOrders(ordersData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };

        fetchAllData();

        const subscription = client.listen(`*[_type in ["parcel", "order"]]`).subscribe(() => {
            console.log("Dashboard data updated, refetching...");
            fetchAllData();
        });

        return () => subscription.unsubscribe();
    }, []);

    const filteredData = useMemo(() => ({
        parcels: filterDataByTime(parcels, timeFilter, 'createdAt'),
        orders: filterDataByTime(orders, timeFilter, 'orderedAt'),
    }), [parcels, orders, timeFilter]);

    const stats = useMemo(() => ({
        delivered: filteredData.parcels.filter(p => p.status === 'Delivered').length,
        pending: filteredData.parcels.filter(p => p.status === 'Pending' || p.status === 'In Transit').length,
        returned: filteredData.parcels.filter(p => p.status === 'Returned').length,
        rescheduled: filteredData.parcels.filter(p => p.status === 'Rescheduled').length,
        totalIncome: filteredData.orders.filter(o => o.orderStatus === 'approved').reduce((sum, o) => sum + (o.orderAmount || 0), 0),
        productsSold: filteredData.orders.filter(o => o.orderStatus === 'approved').reduce((sum, o) => sum + (o.items?.length || 0), 0),
        completedOrders: filteredData.orders.filter(o => o.orderStatus === 'approved').length,
        declinedOrders: filteredData.orders.filter(o => o.orderStatus === 'declined').length,
    }), [filteredData]);

    const parcelChartData = useMemo(() => {
        const counts = { Delivered: 0, Pending: 0, "In Transit": 0, Returned: 0, Rescheduled: 0 };
        filteredData.parcels.forEach(p => { if(counts[p.status] !== undefined) counts[p.status]++; });
        return [
            { name: 'Delivered', count: counts.Delivered },
            { name: 'Pending', count: counts.Pending + counts["In Transit"] },
            { name: 'Returned', count: counts.Returned },
            { name: 'Rescheduled', count: counts.Rescheduled },
        ];
    }, [filteredData.parcels]);

    const salesChartData = useMemo(() => {
        const salesByDay = {};
        filteredData.orders.filter(o => o.orderStatus === 'approved').forEach(o => {
            const day = new Date(o.orderedAt).toLocaleDateString('en-CA');
            if (!salesByDay[day]) salesByDay[day] = 0;
            salesByDay[day] += o.orderAmount;
        });
        return Object.keys(salesByDay).map(day => ({ name: day, sales: salesByDay[day] })).sort((a, b) => new Date(a.name) - new Date(b.name));
    }, [filteredData.orders]);

    return (
        <div className={styles.dashboardContent}>
            <div className={styles.dashboardHeader}>
                <h2>Dashboard</h2>
                <div className={styles.filtersContainer}>
                    <button onClick={() => setTimeFilter('daily')} className={timeFilter === 'daily' ? styles.active : ''}>Daily</button>
                    <button onClick={() => setTimeFilter('weekly')} className={timeFilter === 'weekly' ? styles.active : ''}>Weekly</button>
                    <button onClick={() => setTimeFilter('monthly')} className={timeFilter === 'monthly' ? styles.active : ''}>Monthly</button>
                </div>
            </div>
            
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}><CheckCircle color="#22C55E"/><div><span>Delivered Parcels</span><strong>{stats.delivered}</strong></div></div>
                <div className={styles.summaryCard}><DollarSign color="#22C55E"/><div><span>Total Income</span><strong>Rs. {stats.totalIncome.toFixed(2)}</strong></div></div>
                <div className={styles.summaryCard}><ShoppingBag color="#A855F7"/><div><span>Products Sold</span><strong>{stats.productsSold}</strong></div></div>
                <div className={styles.summaryCard}><ListOrdered color="#14B8A6"/><div><span>Completed Orders</span><strong>{stats.completedOrders}</strong></div></div>
                <div className={styles.summaryCard}><Truck color="#3B82F6"/><div><span>Pending/Transit</span><strong>{stats.pending}</strong></div></div>
                <div className={styles.summaryCard}><Clock color="#64748B"/><div><span>Rescheduled</span><strong>{stats.rescheduled}</strong></div></div>
                <div className={styles.summaryCard}><XCircle color="#EF4444"/><div><span>Returned Parcels</span><strong>{stats.returned}</strong></div></div>
                <div className={styles.summaryCard}><XCircle color="#EF4444"/><div><span>Declined Orders</span><strong>{stats.declinedOrders}</strong></div></div>
            </div>

            <div className={styles.chartsGrid}>
                 <div className="chart-container">
                    <h3>Parcel Summary ({timeFilter})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={parcelChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip contentStyle={{ backgroundColor: '#1E293B' }} /><Legend /><Bar dataKey="count" fill="#3B82F6" /></BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="chart-container">
                    <h3>Sales Growth ({timeFilter})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                            <Legend />
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="sales" stroke="#22C55E" fillOpacity={1} fill="url(#colorSales)" />
                            <Line type="monotone" dataKey="sales" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    );
};

export default DashboardPage;