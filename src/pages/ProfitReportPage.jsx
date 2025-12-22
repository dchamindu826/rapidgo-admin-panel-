import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';
import styles from './ProfitReportPage.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

// Commission Rates
const RIDE_COMMISSION_RATE = 0.35; // 35% from Delivery Charge
const FOOD_COMMISSION_RATE = 0.05; // 5% from Food Total

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const fetchProfitData = async (year, month) => {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month, getDaysInMonth(year, month), 23, 59, 59).toISOString();

    const query = `
        *[_type == 'foodOrder' && 
          orderStatus == 'completed' &&
          createdAt >= $startDate && 
          createdAt <= $endDate
        ] {
          createdAt,
          deliveryCharge,
          foodTotal
        }
    `;
    
    const orders = await client.fetch(query, { startDate, endDate });

    let totalProfit = 0;
    const dailyProfit = {};

    orders.forEach(order => {
        const rideProfit = (order.deliveryCharge || 0) * RIDE_COMMISSION_RATE;
        const foodProfit = (order.foodTotal || 0) * FOOD_COMMISSION_RATE;
        const netProfit = rideProfit + foodProfit;

        totalProfit += netProfit;

        const day = new Date(order.createdAt).getDate();
        dailyProfit[day] = (dailyProfit[day] || 0) + netProfit;
    });

    const chartData = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => {
        const day = i + 1;
        return {
            name: `Day ${day}`,
            Profit: dailyProfit[day] || 0,
        };
    });

    return { totalProfit, totalOrders: orders.length, chartData };
};

export default function ProfitReportPage() {
    const [currentMonthData, setCurrentMonthData] = useState(null);
    const [lastMonthData, setLastMonthData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentDate] = useState(new Date());
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const lastMonthDate = new Date(currentDate);
    lastMonthDate.setMonth(currentDate.getMonth() - 1);

    useEffect(() => {
        const loadReports = async () => {
            setLoading(true);
            try {
                const currentData = await fetchProfitData(currentYear, currentMonth);
                const lastData = await fetchProfitData(lastMonthDate.getFullYear(), lastMonthDate.getMonth());
                setCurrentMonthData(currentData);
                setLastMonthData(lastData);
            } catch (error) {
                console.error("Failed to load profit report:", error);
                alert("Could not load reports.");
            }
            setLoading(false);
        };
        loadReports();
    }, [currentYear, currentMonth]);

    let percentageChange = 0;
    if (lastMonthData?.totalProfit > 0) {
        percentageChange = ((currentMonthData?.totalProfit - lastMonthData?.totalProfit) / lastMonthData?.totalProfit) * 100;
    } else if (currentMonthData?.totalProfit > 0) {
        percentageChange = 100;
    }

    const isProfit = percentageChange >= 0;

    if (loading) return <div className={`content-box ${styles.profitPage}`}><h2>Loading Profit Reports...</h2></div>;

    return (
        <div className={styles.profitPage}>
            <div className={`content-box ${styles.headerBox}`}>
                <h2>Monthly Profit Report</h2>
                <p>Profit: 35% from Rides + 5% from Food Sales</p>
                <p>Comparing {currentDate.toLocaleString('default', { month: 'long' })} vs. {lastMonthDate.toLocaleString('default', { month: 'long' })}</p>
            </div>

            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <span>This Month's Net Profit</span>
                    <strong>Rs. {currentMonthData?.totalProfit.toFixed(2)}</strong>
                    <small>{currentMonthData?.totalOrders} completed orders</small>
                </div>
                <div className={styles.summaryCard}>
                    <span>Last Month's Net Profit</span>
                    <strong>Rs. {lastMonthData?.totalProfit.toFixed(2)}</strong>
                    <small>{lastMonthData?.totalOrders} completed orders</small>
                </div>
                <div className={`${styles.summaryCard} ${isProfit ? styles.profit : styles.loss}`}>
                    <span>Monthly Gain/Loss</span>
                    <strong>{percentageChange.toFixed(1)}%</strong>
                    <small>{isProfit ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />} {isProfit ? 'Increase' : 'Decrease'}</small>
                </div>
            </div>

            <div className={`content-box ${styles.chartBox}`}>
                <h3>This Month's Daily Profit (Rs.)</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={currentMonthData?.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" interval={2} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}