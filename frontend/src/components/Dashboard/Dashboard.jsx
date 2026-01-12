import { useState, useEffect } from 'react';
import { sharingAPI } from '../../utils/api';
import UploadReport from '../Reports/UploadReport';
import ReportList from '../Reports/ReportList';
import VitalsChart from '../Vitals/VitalsChart';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('reports');
    const [sharedReports, setSharedReports] = useState([]);

    useEffect(() => {
        fetchSharedReports();
    }, []);

    const fetchSharedReports = async () => {
        try {
            const response = await sharingAPI.getReceived();
            setSharedReports(response.data.reports || []);
        } catch (error) {
            console.error('Error fetching shared reports:', error);
        }
    };

    const handleUploadSuccess = () => {
        setActiveTab('reports');
    };

    return (
        <div className="dashboard">
            <nav className="dashboard-nav glass">
                <div className="nav-brand">
                    <h1>🏥 Health Wallet</h1>
                </div>

                <div className="nav-menu">
                    <button
                        className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        📋 My Reports
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        📤 Upload
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'vitals' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vitals')}
                    >
                        📊 Vitals
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'shared' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shared')}
                    >
                        🤝 Shared {sharedReports.length > 0 && <span className="badge">{sharedReports.length}</span>}
                    </button>
                </div>

                <div className="nav-user">
                    <div className="user-info">
                        <span className="user-name">{user.fullName}</span>
                        <span className="user-email">{user.email}</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <main className="dashboard-main">
                <div className="dashboard-content">
                    {activeTab === 'reports' && <ReportList />}
                    {activeTab === 'upload' && <UploadReport onUploadSuccess={handleUploadSuccess} />}
                    {activeTab === 'vitals' && <VitalsChart />}
                    {activeTab === 'shared' && <SharedReportsView reports={sharedReports} />}
                </div>
            </main>
        </div>
    );
};

const SharedReportsView = ({ reports }) => {
    const handleView = (reportId) => {
        const token = localStorage.getItem('token');
        window.open(`http://localhost:5000/api/reports/${reportId}/file?token=${token}`, '_blank');
    };

    return (
        <div className="shared-reports-container">
            <div className="shared-header">
                <h2>Shared With Me</h2>
                <p>Reports that others have shared with you</p>
            </div>

            {reports.length === 0 ? (
                <div className="empty-state">
                    <p>No reports have been shared with you yet.</p>
                </div>
            ) : (
                <div className="reports-grid">
                    {reports.map(report => (
                        <div key={report.id} className="report-card card">
                            <div className="report-card-header">
                                <h3>{report.title}</h3>
                                <span className="report-type-badge">{report.report_type}</span>
                            </div>

                            <div className="report-card-body">
                                <div className="report-info">
                                    <div className="info-item">
                                        <span className="info-label">Shared by:</span>
                                        <span>{report.owner_name} ({report.owner_email})</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Report Date:</span>
                                        <span>{new Date(report.report_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Shared on:</span>
                                        <span>{new Date(report.shared_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="report-card-actions">
                                <button className="btn btn-primary" onClick={() => handleView(report.id)}>
                                    View Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
