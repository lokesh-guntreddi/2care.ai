import { useState } from 'react';
import { reportsAPI } from '../../utils/api';
import './UploadReport.css';

const REPORT_TYPES = [
    'Blood Test',
    'X-Ray',
    'MRI Scan',
    'CT Scan',
    'Ultrasound',
    'ECG',
    'General Checkup',
    'Prescription',
    'Other'
];

const VITAL_TYPES = [
    { type: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
    { type: 'Blood Sugar', unit: 'mg/dL', placeholder: '100' },
    { type: 'Heart Rate', unit: 'bpm', placeholder: '72' },
    { type: 'Temperature', unit: '°F', placeholder: '98.6' },
    { type: 'Weight', unit: 'kg', placeholder: '70' },
    { type: 'Height', unit: 'cm', placeholder: '170' },
    { type: 'Oxygen Saturation', unit: '%', placeholder: '98' },
    { type: 'Cholesterol', unit: 'mg/dL', placeholder: '200' },
];

const UploadReport = ({ onUploadSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        reportType: REPORT_TYPES[0],
        reportDate: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [file, setFile] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const addVital = () => {
        setVitals([...vitals, { type: VITAL_TYPES[0].type, value: '', unit: VITAL_TYPES[0].unit }]);
    };

    const removeVital = (index) => {
        setVitals(vitals.filter((_, i) => i !== index));
    };

    const updateVital = (index, field, value) => {
        const updated = [...vitals];
        updated[index][field] = value;
        if (field === 'type') {
            const vitalInfo = VITAL_TYPES.find(v => v.type === value);
            updated[index].unit = vitalInfo?.unit || '';
        }
        setVitals(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append('file', file);
            data.append('title', formData.title);
            data.append('reportType', formData.reportType);
            data.append('reportDate', formData.reportDate);
            data.append('notes', formData.notes);

            if (vitals.length > 0) {
                data.append('vitals', JSON.stringify(vitals));
            }

            await reportsAPI.upload(data);

            setSuccess('Report uploaded successfully!');
            setFormData({
                title: '',
                reportType: REPORT_TYPES[0],
                reportDate: new Date().toISOString().split('T')[0],
                notes: '',
            });
            setFile(null);
            setVitals([]);

            if (onUploadSuccess) {
                setTimeout(() => onUploadSuccess(), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <h2>Upload Health Report</h2>
                <p>Add a new medical report to your health wallet</p>
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-grid">
                    <div className="form-group">
                        <label className="label">Report Title *</label>
                        <input
                            type="text"
                            name="title"
                            className="input"
                            placeholder="e.g., Annual Physical Exam 2024"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Report Type *</label>
                        <select
                            name="reportType"
                            className="input"
                            value={formData.reportType}
                            onChange={handleChange}
                            required
                        >
                            {REPORT_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="label">Report Date *</label>
                        <input
                            type="date"
                            name="reportDate"
                            className="input"
                            value={formData.reportDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Upload File * (PDF or Image)</label>
                        <input
                            type="file"
                            className="input file-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            required
                        />
                        {file && <span className="file-name">{file.name}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="label">Notes (Optional)</label>
                    <textarea
                        name="notes"
                        className="input textarea"
                        placeholder="Any additional notes or observations..."
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                    />
                </div>

                <div className="vitals-section">
                    <div className="vitals-header">
                        <h3>Vitals</h3>
                        <button type="button" className="btn btn-secondary" onClick={addVital}>
                            + Add Vital
                        </button>
                    </div>

                    {vitals.map((vital, index) => (
                        <div key={index} className="vital-row">
                            <select
                                className="input"
                                value={vital.type}
                                onChange={(e) => updateVital(index, 'type', e.target.value)}
                            >
                                {VITAL_TYPES.map(v => (
                                    <option key={v.type} value={v.type}>{v.type}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                className="input"
                                placeholder={VITAL_TYPES.find(v => v.type === vital.type)?.placeholder || 'Value'}
                                value={vital.value}
                                onChange={(e) => updateVital(index, 'value', e.target.value)}
                            />

                            <input
                                type="text"
                                className="input unit-input"
                                value={vital.unit}
                                readOnly
                            />

                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeVital(index)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload Report'}
                </button>
            </form>
        </div>
    );
};

export default UploadReport;
