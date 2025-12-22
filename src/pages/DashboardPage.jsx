import React, { useState, useEffect, useMemo } from 'react';
import { client } from '../sanityClient';
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
    const [foodOrders, setFoodOrders] = useState([]);
    const [deliveryOrders, setDeliveryOrders] = useState([]);
    const [timeFilter, setTimeFilter] = useState('monthly');

    useEffect(() => {
        const fetchAllData = async () => {
            const parcelsQuery = `*[_type == "parcel"]{status, createdAt}`;
            const ordersQuery = `*[_type == "order"]{orderAmount, orderStatus, orderedAt, items}`;
            // UPDATED: added foodTotal to the query to calculate 5% commission
            const foodOrdersQuery = `*[_type == "foodOrder"]{grandTotal, deliveryCharge, foodTotal, orderStatus, createdAt}`;
            const deliveryOrdersQuery = `*[_type == "deliveryOrder"]{status, createdAt}`;
            try {
                const [parcelsData, ordersData, foodOrdersData, deliveryOrdersData] = await Promise.all([
                    client.fetch(parcelsQuery), 
                    client.fetch(ordersQuery),
                    client.fetch(foodOrdersQuery),
                    client.fetch(deliveryOrdersQuery)
                ]);

                setParcels(parcelsData);
                setOrders(ordersData);
                setFoodOrders(foodOrdersData);
                setDeliveryOrders(deliveryOrdersData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };

        fetchAllData();

        const subscription = client.listen(`*[_type in ["parcel", "order", "foodOrder", "deliveryOrder"]]`).subscribe(() => {
            console.log("Dashboard data updated, refetching...");
            fetchAllData();
        });

        return () => subscription.unsubscribe();
    }, []);

    const filteredData = useMemo(() => ({
        parcels: filterDataByTime(parcels, timeFilter, 'createdAt'),
        orders: filterDataByTime(orders, timeFilter, 'orderedAt'),
        foodOrders: filterDataByTime(foodOrders, timeFilter, 'createdAt'),
        deliveryOrders: filterDataByTime(deliveryOrders, timeFilter, 'createdAt'),
    }), [parcels, orders, foodOrders, deliveryOrders, timeFilter]);

    const stats = useMemo(() => {
        const deliveredParcels = filteredData.parcels.filter(p => p.status === 'Delivered').length;
        const pendingParcels = filteredData.parcels.filter(p => p.status === 'Pending' || p.status === 'In Transit').length;
        const returnedParcels = filteredData.parcels.filter(p => p.status === 'Returned').length;
        const rescheduledParcels = filteredData.parcels.filter(p => p.status === 'Rescheduled').length;
        const approvedDigitalOrders = filteredData.orders.filter(o => o.orderStatus === 'approved');
        const digitalIncome = approvedDigitalOrders.reduce((sum, o) => sum + (o.orderAmount || 0), 0);
        const productsSold = approvedDigitalOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
        const declinedDigitalOrders = filteredData.orders.filter(o => o.orderStatus === 'declined').length;
        const completedFoodOrders = filteredData.foodOrders.filter(o => o.orderStatus === 'completed');
        const foodIncome = completedFoodOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        
        // UPDATED: Admin Profit calculation (35% from Delivery + 5% from Food)
        const adminDeliveryIncome = completedFoodOrders.reduce((sum, o) => 
            sum + ((o.deliveryCharge || 0) * 0.35) + ((o.foodTotal || 0) * 0.05), 0
        );

        const pendingFoodOrders = filteredData.foodOrders.filter(o => ['pending', 'preparing', 'readyForPickup', 'assigned'].includes(o.orderStatus)).length;
        const completedDeliveryReqs = filteredData.deliveryOrders.filter(o => o.status === 'completed').length;
        const pendingDeliveryReqs = filteredData.deliveryOrders.filter(o => ['pending', 'assigned'].includes(o.status)).length;
        
        return {
          totalIncome: digitalIncome + foodIncome, 
          totalAdminDeliveryIncome: adminDeliveryIncome, 
          totalCompletedOrders: approvedDigitalOrders.length + completedFoodOrders.length + completedDeliveryReqs,
          totalPending: pendingParcels + pendingFoodOrders + pendingDeliveryReqs,
          productsSold: productsSold,
          declinedOrders: declinedDigitalOrders,
          deliveredParcels: deliveredParcels,
          returnedParcels: returnedParcels,
          rescheduledParcels: rescheduledParcels,
        };
    }, [filteredData]);

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
            if (!salesByDay[day]) salesByDay[day] = { sales: 0 };
            salesByDay[day].sales += (o.orderAmount || 0);
        });
        
        filteredData.foodOrders.filter(o => o.orderStatus === 'completed').forEach(o => {
            const day = new Date(o.createdAt).toLocaleDateString('en-CA');
            if (!salesByDay[day]) salesByDay[day] = { sales: 0 };
            salesByDay[day].sales += (o.grandTotal || 0);
        });

        return Object.keys(salesByDay).map(day => ({ name: day, sales: salesByDay[day].sales })).sort((a, b) => new Date(a.name) - new Date(b.name));
    }, [filteredData.orders, filteredData.foodOrders]);

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
            
                <div className={styles.summaryCard}><DollarSign color="#22C55E"/><div>
                    <span>Total Income (All)</span><strong>Rs. {stats.totalIncome.toFixed(2)}</strong>
                </div></div>
                
                <div className={styles.summaryCard}><DollarSign color="#14B8A6"/><div>
                    <span>Admin Net Profit </span><strong>Rs. {stats.totalAdminDeliveryIncome.toFixed(2)}</strong>
                </div></div>

                <div className={styles.summaryCard}><CheckCircle color="#22C55E"/><div>
                    <span>Total Completed Orders</span><strong>{stats.totalCompletedOrders}</strong>
                </div></div>

                <div className={styles.summaryCard}><Truck color="#3B82F6"/><div>
                    <span>Total Pending Orders</span><strong>{stats.totalPending}</strong>
                </div></div>
                
                <div className={styles.summaryCard}><ShoppingBag color="#A855F7"/><div>
                    <span>Products Sold (Digital)</span><strong>{stats.productsSold}</strong>
                </div></div>

                <div className={styles.summaryCard}><Package color="#64748B"/><div>
                    <span>Delivered Parcels</span><strong>{stats.deliveredParcels}</strong>
                </div></div>

                <div className={styles.summaryCard}><XCircle color="#EF4444"/><div>
                    <span>Returned Parcels</span><strong>{stats.returnedParcels}</strong>
                </div></div>
                
                <div className={styles.summaryCard}><XCircle color="#EF4444"/><div>
                    <span>Declined Digital Orders</span><strong>{stats.declinedOrders}</strong>
                </div></div>

            </div>

            <div className={styles.chartsGrid}>
                <div className={styles.chartContainer}> 
                    <h3>Parcel Summary ({timeFilter})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={parcelChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip contentStyle={{ backgroundColor: '#1E293B' }} /><Legend /><Bar dataKey="count" fill="#3B82F6" /></BarChart>
                    </ResponsiveContainer>
                </div>
                <div className={styles.chartContainer}>
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