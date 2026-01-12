import { useState, useEffect } from 'react';
import { reportsAPI, sharingAPI } from '../../utils/api';
import ShareModal from '../Sharing/ShareModal';
import './ReportList.css';

const ReportList = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        reportType: '',
        startDate: '',
        endDate: '',
    });
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, reports]);

    const fetchReports = async () => {
        try {
            const response = await reportsAPI.getAll();
            setReports(response.data.reports);
            setFilteredReports(response.data.reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...reports];

        if (filters.search) {
            filtered = filtered.filter(report =>
                report.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                report.report_type.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        if (filters.reportType) {
            filtered = filtered.filter(report => report.report_type === filters.reportType);
        }

        if (filters.startDate) {
            filtered = filtered.filter(report => report.report_date >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter(report => report.report_date <= filters.endDate);
        }

        setFilteredReports(filtered);
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return;
        }

        try {
            await reportsAPI.delete(id);
            setReports(reports.filter(r => r.id !== id));
        } catch (error) {
            alert('Failed to delete report');
        }
    };

    const handleShare = (report) => {
        setSelectedReport(report);
        setShareModalOpen(true);
    };

    const handleView = async (reportId) => {
        try {
            const response = await reportsAPI.downloadFile(reportId);

            // Create a blob URL and open it
            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error('Error viewing file:', error);
            alert('Failed to view file');
        }
    };

    const reportTypes = [...new Set(reports.map(r => r.report_type))];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="report-list-container">
            <div className="report-list-header">
                <h2>My Health Reports</h2>
                <p>{filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found</p>
            </div>

            <div className="filters-card glass">
                <input
                    type="text"
                    name="search"
                    className="input"
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={handleFilterChange}
                />

                <select
                    name="reportType"
                    className="input"
                    value={filters.reportType}
                    onChange={handleFilterChange}
                >
                    <option value="">All Types</option>
                    {reportTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>

                <input
                    type="date"
                    name="startDate"
                    className="input"
                    placeholder="From date"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                />

                <input
                    type="date"
                    name="endDate"
                    className="input"
                    placeholder="To date"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                />
            </div>

            <div className="reports-grid">
                {filteredReports.length === 0 ? (
                    <div className="empty-state">
                        <p>No reports found. Upload your first health report to get started!</p>
                    </div>
                ) : (
                    filteredReports.map(report => (
                        <div key={report.id} className="report-card card">
                            <div className="report-card-header">
                                <h3>{report.title}</h3>
                                <span className="report-type-badge">{report.report_type}</span>
                            </div>

                            <div className="report-card-body">
                                <div className="report-info">
                                    <div className="info-item">
                                        <span className="info-label">Date:</span>
                                        <span>{new Date(report.report_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Vitals:</span>
                                        <span>{report.vital_count || 0}</span>
                                    </div>
                                    {report.notes && (
                                        <div className="report-notes">
                                            <span className="info-label">Notes:</span>
                                            <p>{report.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="report-card-actions">
                                <button className="btn btn-secondary" onClick={() => handleView(report.id)}>
                                    View
                                </button>
                                <button className="btn btn-secondary" onClick={() => handleShare(report)}>
                                    Share
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDelete(report.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {shareModalOpen && (
                <ShareModal
                    report={selectedReport}
                    onClose={() => setShareModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ReportList;
