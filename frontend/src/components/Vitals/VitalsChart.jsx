import { useState, useEffect } from 'react';
import { vitalsAPI } from '../../utils/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './VitalsChart.css';

const VITAL_COLORS = {
    'Blood Pressure': '#6366f1',
    'Blood Sugar': '#8b5cf6',
    'Heart Rate': '#06b6d4',
    'Temperature': '#f59e0b',
    'Weight': '#10b981',
    'Oxygen Saturation': '#ec4899',
    'Cholesterol': '#ef4444',
};

const VitalsChart = () => {
    const [vitals, setVitals] = useState([]);
    const [summary, setSummary] = useState([]);
    const [selectedVital, setSelectedVital] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        if (selectedVital) {
            fetchVitalsTrends();
        }
    }, [selectedVital, dateRange]);

    const fetchSummary = async () => {
        try {
            const response = await vitalsAPI.getSummary();
            setSummary(response.data.summary);
            if (response.data.summary.length > 0) {
                setSelectedVital(response.data.summary[0].vitalType);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVitalsTrends = async () => {
        try {
            const params = {
                vitalType: selectedVital,
                ...dateRange,
            };
            const response = await vitalsAPI.getTrends(params);
            setVitals(response.data.vitals);
        } catch (error) {
            console.error('Error fetching vitals trends:', error);
        }
    };

    const handleDateChange = (e) => {
        setDateRange({
            ...dateRange,
            [e.target.name]: e.target.value,
        });
    };

    const chartData = vitals.map(vital => ({
        date: new Date(vital.measured_at).toLocaleDateString(),
        value: parseFloat(vital.value) || 0,
        fullDate: vital.measured_at,
    }));

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (summary.length === 0) {
        return (
            <div className="vitals-empty-state">
                <h3>No Vitals Data</h3>
                <p>Upload health reports with vitals to see trends and insights.</p>
            </div>
        );
    }

    return (
        <div className="vitals-chart-container">
            <div className="vitals-header">
                <h2>Vitals Trends</h2>
                <p>Track your health metrics over time</p>
            </div>

            <div className="vitals-summary">
                {summary.map(item => (
                    <div
                        key={item.vitalType}
                        className={`vital-summary-card card ${selectedVital === item.vitalType ? 'active' : ''}`}
                        onClick={() => setSelectedVital(item.vitalType)}
                    >
                        <div className="vital-icon" style={{ background: VITAL_COLORS[item.vitalType] || 'var(--primary)' }}>
                            {item.vitalType.charAt(0)}
                        </div>
                        <div className="vital-info">
                            <h4>{item.vitalType}</h4>
                            <p className="vital-value">
                                {item.latestValue} <span>{item.unit}</span>
                            </p>
                            <span className="vital-count">{item.count} records</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chart-card glass">
                <div className="chart-controls">
                    <select
                        value={selectedVital}
                        onChange={(e) => setSelectedVital(e.target.value)}
                        className="input"
                    >
                        {summary.map(item => (
                            <option key={item.vitalType} value={item.vitalType}>
                                {item.vitalType}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        name="startDate"
                        className="input"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                    />

                    <input
                        type="date"
                        name="endDate"
                        className="input"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                    />
                </div>

                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                stroke="var(--text-secondary)"
                                style={{ fontSize: '0.875rem' }}
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                style={{ fontSize: '0.875rem' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--border-radius)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={VITAL_COLORS[selectedVital] || 'var(--primary)'}
                                strokeWidth={3}
                                dot={{ fill: VITAL_COLORS[selectedVital] || 'var(--primary)', r: 5 }}
                                activeDot={{ r: 7 }}
                                name={selectedVital}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="chart-empty">
                        <p>No data available for the selected vital and date range.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VitalsChart;
