const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed'));
        }
    }
});

// Upload new report
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, reportType, reportDate, notes, vitals } = req.body;

    if (!title || !reportType || !reportDate) {
        return res.status(400).json({ error: 'Title, report type, and date are required' });
    }

    const userId = req.user.userId;
    const filePath = req.file.path;
    const fileType = req.file.mimetype;

    db.run(
        `INSERT INTO reports (user_id, title, report_type, file_path, file_type, report_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, reportType, filePath, fileType, reportDate, notes || ''],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to save report' });
            }

            const reportId = this.lastID;

            // Parse and save vitals if provided
            if (vitals) {
                try {
                    const vitalsArray = JSON.parse(vitals);
                    const vitalInserts = vitalsArray.map(vital => {
                        return new Promise((resolve, reject) => {
                            db.run(
                                `INSERT INTO vitals (report_id, vital_type, value, unit, measured_at)
                 VALUES (?, ?, ?, ?, ?)`,
                                [reportId, vital.type, vital.value, vital.unit, reportDate],
                                (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        });
                    });

                    Promise.all(vitalInserts)
                        .then(() => {
                            res.status(201).json({
                                message: 'Report uploaded successfully',
                                reportId,
                                file: req.file.filename
                            });
                        })
                        .catch(() => {
                            res.status(201).json({
                                message: 'Report uploaded, but some vitals failed to save',
                                reportId
                            });
                        });
                } catch (e) {
                    res.status(201).json({
                        message: 'Report uploaded successfully',
                        reportId
                    });
                }
            } else {
                res.status(201).json({
                    message: 'Report uploaded successfully',
                    reportId,
                    file: req.file.filename
                });
            }
        }
    );
});

// Get all reports for logged-in user
router.get('/', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.all(
        `SELECT r.*, 
     (SELECT COUNT(*) FROM vitals WHERE report_id = r.id) as vital_count
     FROM reports r
     WHERE r.user_id = ?
     ORDER BY r.report_date DESC`,
        [userId],
        (err, reports) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch reports' });
            }
            res.json({ reports });
        }
    );
});

// Get single report by ID
router.get('/:id', authenticateToken, (req, res) => {
    const reportId = req.params.id;
    const userId = req.user.userId;

    // Check if user owns the report or has shared access
    db.get(
        `SELECT r.* FROM reports r
     WHERE r.id = ? AND (r.user_id = ? OR EXISTS (
       SELECT 1 FROM shared_access sa
       WHERE sa.report_id = r.id AND (sa.shared_with_email = ? OR sa.shared_with_user_id = ?)
     ))`,
        [reportId, userId, req.user.email, userId],
        (err, report) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!report) {
                return res.status(404).json({ error: 'Report not found or access denied' });
            }

            // Get associated vitals
            db.all(
                'SELECT * FROM vitals WHERE report_id = ? ORDER BY measured_at DESC',
                [reportId],
                (err, vitals) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch vitals' });
                    }

                    res.json({ report, vitals });
                }
            );
        }
    );
});

// Delete report
router.delete('/:id', authenticateToken, (req, res) => {
    const reportId = req.params.id;
    const userId = req.user.userId;

    // Get the report to delete the file
    db.get(
        'SELECT * FROM reports WHERE id = ? AND user_id = ?',
        [reportId, userId],
        (err, report) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!report) {
                return res.status(404).json({ error: 'Report not found or access denied' });
            }

            // Delete the file
            if (fs.existsSync(report.file_path)) {
                fs.unlinkSync(report.file_path);
            }

            // Delete from database (cascade will handle vitals and shares)
            db.run('DELETE FROM reports WHERE id = ?', [reportId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to delete report' });
                }
                res.json({ message: 'Report deleted successfully' });
            });
        }
    );
});

// Search/Filter reports
router.get('/search/filter', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { startDate, endDate, reportType, vitalType } = req.query;

    let query = 'SELECT DISTINCT r.* FROM reports r ';
    let params = [userId];
    let conditions = ['r.user_id = ?'];

    if (vitalType) {
        query += 'INNER JOIN vitals v ON r.id = v.report_id ';
        conditions.push('v.vital_type = ?');
        params.push(vitalType);
    }

    if (startDate) {
        conditions.push('r.report_date >= ?');
        params.push(startDate);
    }

    if (endDate) {
        conditions.push('r.report_date <= ?');
        params.push(endDate);
    }

    if (reportType) {
        conditions.push('r.report_type = ?');
        params.push(reportType);
    }

    query += 'WHERE ' + conditions.join(' AND ') + ' ORDER BY r.report_date DESC';

    db.all(query, params, (err, reports) => {
        if (err) {
            return res.status(500).json({ error: 'Search failed' });
        }
        res.json({ reports });
    });
});

// Download/view file
router.get('/:id/file', authenticateToken, (req, res) => {
    const reportId = req.params.id;
    const userId = req.user.userId;

    db.get(
        `SELECT r.* FROM reports r
     WHERE r.id = ? AND (r.user_id = ? OR EXISTS (
       SELECT 1 FROM shared_access sa
       WHERE sa.report_id = r.id AND (sa.shared_with_email = ? OR sa.shared_with_user_id = ?)
     ))`,
        [reportId, userId, req.user.email, userId],
        (err, report) => {
            if (err || !report) {
                return res.status(404).json({ error: 'Report not found or access denied' });
            }

            if (!fs.existsSync(report.file_path)) {
                return res.status(404).json({ error: 'File not found' });
            }

            res.sendFile(path.resolve(report.file_path));
        }
    );
});

module.exports = router;
