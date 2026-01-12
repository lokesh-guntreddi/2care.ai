const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Add vitals to a report
router.post('/', authenticateToken, (req, res) => {
    const { reportId, vitalType, value, unit, measuredAt } = req.body;
    const userId = req.user.userId;

    if (!reportId || !vitalType || !value || !unit) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify user owns the report
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

            db.run(
                `INSERT INTO vitals (report_id, vital_type, value, unit, measured_at)
         VALUES (?, ?, ?, ?, ?)`,
                [reportId, vitalType, value, unit, measuredAt || new Date().toISOString()],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to add vital' });
                    }

                    res.status(201).json({
                        message: 'Vital added successfully',
                        vitalId: this.lastID
                    });
                }
            );
        }
    );
});

// Get vitals for a specific report
router.get('/report/:reportId', authenticateToken, (req, res) => {
    const reportId = req.params.reportId;
    const userId = req.user.userId;

    // Verify access to report
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

            db.all(
                'SELECT * FROM vitals WHERE report_id = ? ORDER BY measured_at DESC',
                [reportId],
                (err, vitals) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch vitals' });
                    }
                    res.json({ vitals });
                }
            );
        }
    );
});

// Get vitals trends over time
router.get('/trends', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { vitalType, startDate, endDate } = req.query;

    let query = `
    SELECT v.*, r.report_date
    FROM vitals v
    INNER JOIN reports r ON v.report_id = r.id
    WHERE r.user_id = ?
  `;
    let params = [userId];

    if (vitalType) {
        query += ' AND v.vital_type = ?';
        params.push(vitalType);
    }

    if (startDate) {
        query += ' AND r.report_date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND r.report_date <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY v.measured_at ASC';

    db.all(query, params, (err, vitals) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch vitals trends' });
        }
        res.json({ vitals });
    });
});

// Get vitals summary/statistics
router.get('/summary', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.all(
        `SELECT 
      v.vital_type,
      COUNT(*) as count,
      v.unit,
      GROUP_CONCAT(v.value) as recent_values,
      MAX(v.measured_at) as latest_measurement
     FROM vitals v
     INNER JOIN reports r ON v.report_id = r.id
     WHERE r.user_id = ?
     GROUP BY v.vital_type, v.unit
     ORDER BY latest_measurement DESC`,
        [userId],
        (err, summary) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch summary' });
            }

            // Parse recent values to get last 3
            const formattedSummary = summary.map(item => ({
                vitalType: item.vital_type,
                count: item.count,
                unit: item.unit,
                latestValue: item.recent_values.split(',').pop(),
                latestMeasurement: item.latest_measurement
            }));

            res.json({ summary: formattedSummary });
        }
    );
});

// Delete vital
router.delete('/:id', authenticateToken, (req, res) => {
    const vitalId = req.params.id;
    const userId = req.user.userId;

    // Verify user owns the report containing this vital
    db.get(
        `SELECT v.* FROM vitals v
     INNER JOIN reports r ON v.report_id = r.id
     WHERE v.id = ? AND r.user_id = ?`,
        [vitalId, userId],
        (err, vital) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!vital) {
                return res.status(404).json({ error: 'Vital not found or access denied' });
            }

            db.run('DELETE FROM vitals WHERE id = ?', [vitalId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to delete vital' });
                }
                res.json({ message: 'Vital deleted successfully' });
            });
        }
    );
});

module.exports = router;
