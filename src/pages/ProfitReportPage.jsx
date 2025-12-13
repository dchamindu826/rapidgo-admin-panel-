import React, { useState, useEffect } from 'react';
import { client } from '../sanityClient';
import styles from './ProfitReportPage.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, ListOrdered } from 'lucide-react';

// Admin Commission eka (35%) - UPDATED HERE
const ADMIN_COMMISSION_RATE = 0.35;

// Mase anthima data eka ganna helper function ekak
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Data eka fetch karana main function eka
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
          deliveryCharge
        }
    `;
    
    const orders = await client.fetch(query, { startDate, endDate });

    let totalDeliveryCharge = 0;
    const dailyProfit = {}; // Chart ekata

    orders.forEach(order => {
        if (order.deliveryCharge) {
            totalDeliveryCharge += order.deliveryCharge;

            const day = new Date(order.createdAt).getDate();
            const profit = order.deliveryCharge * ADMIN_COMMISSION_RATE;
            dailyProfit[day] = (dailyProfit[day] || 0) + profit;
        }
    });

    const totalProfit = totalDeliveryCharge * ADMIN_COMMISSION_RATE;

    // Chart ekata data eka hadanawa
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
    const currentMonth = currentDate.getMonth(); // 0 = Jan, 11 = Dec
    
    const lastMonthDate = new Date(currentDate);
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    useEffect(() => {
        const loadReports = async () => {
            setLoading(true);
            try {
                const currentData = await fetchProfitData(currentYear, currentMonth);
                const lastData = await fetchProfitData(lastMonthYear, lastMonth);
                
                setCurrentMonthData(currentData);
                setLastMonthData(lastData);

            } catch (error) {
                console.error("Failed to load profit report:", error);
                alert("Could not load reports.");
            }
            setLoading(false);
        };
        loadReports();
    }, [currentYear, currentMonth, lastMonthYear, lastMonth]);

    // Percentage calculation
    let percentageChange = 0;
    if (lastMonthData?.totalProfit > 0) {
        percentageChange = ((currentMonthData?.totalProfit - lastMonthData?.totalProfit) / lastMonthData?.totalProfit) * 100;
    } else if (currentMonthData?.totalProfit > 0) {
        percentageChange = 100; // Giya mase 0, me mase profit
    }

    const isProfit = percentageChange >= 0;

    if (loading) {
        return <div className={`content-box ${styles.profitPage}`}><h2>Loading Profit Reports...</h2></div>;
    }

    return (
        <div className={styles.profitPage}>
            <div className={`content-box ${styles.headerBox}`}>
                <h2>Monthly Profit Report</h2>
                <p>Comparing {currentDate.toLocaleString('default', { month: 'long' })} vs. {lastMonthDate.toLocaleString('default', { month: 'long' })}</p>
            </div>

            {/* --- Summary Cards --- */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    {/* Label updated to reflect 35% */}
                    <span>This Month's Profit (35%)</span>
                    <strong>Rs. {currentMonthData?.totalProfit.toFixed(2)}</strong>
                    <small>{currentMonthData?.totalOrders} completed orders</small>
                </div>
                <div className={styles.summaryCard}>
                    {/* Label updated to reflect 35% */}
                    <span>Last Month's Profit (35%)</span>
                    <strong>Rs. {lastMonthData?.totalProfit.toFixed(2)}</strong>
                    <small>{lastMonthData?.totalOrders} completed orders</small>
                </div>
                <div className={`${styles.summaryCard} ${isProfit ? styles.profit : styles.loss}`}>
                    <span>Monthly Gain/Loss</span>
                    <strong>{percentageChange.toFixed(1)}%</strong>
                    <small>{isProfit ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />} 
                        {isProfit ? 'Increase' : 'Decrease'} vs. Last Month
                    </small>
                </div>
            </div>

            {/* --- Chart --- */}
            <div className={`content-box ${styles.chartBox}`}>
                <h3>This Month's Daily Profit (Rs.)</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={currentMonthData?.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGridColor} />
                        
                        <XAxis dataKey="name" stroke={styles.chartTextColor} interval={2} />

                        <YAxis stroke={styles.chartTextColor} />
                        <Tooltip
                            contentStyle={{ backgroundColor: styles.tooltipBg, border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: styles.chartTextColor }}
                        />
                        <Bar dataKey="Profit" fill={styles.profitColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}