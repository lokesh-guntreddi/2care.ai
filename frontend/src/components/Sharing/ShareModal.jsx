import { useState } from 'react';
import { sharingAPI } from '../../utils/api';
import './ShareModal.css';

const ShareModal = ({ report, onClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);

        try {
            await sharingAPI.share({
                reportId: report.id,
                email,
            });

            setSuccess('Report shared successfully!');
            setEmail('');

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to share report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Share Report</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="report-preview">
                        <h4>{report.title}</h4>
                        <p>{report.report_type} • {new Date(report.report_date).toLocaleDateString()}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <div className="form-group">
                            <label className="label">Share with (Email)</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="recipient@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <p className="help-text">
                                The recipient will be able to view this report and its associated vitals.
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Sharing...' : 'Share Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
