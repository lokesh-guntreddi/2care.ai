const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Share a report with someone
router.post('/share', authenticateToken, (req, res) => {
    const { reportId, email } = req.body;
    const userId = req.user.userId;

    if (!reportId || !email) {
        return res.status(400).json({ error: 'Report ID and email are required' });
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

            // Check if already shared with this email
            db.get(
                'SELECT * FROM shared_access WHERE report_id = ? AND shared_with_email = ?',
                [reportId, email],
                (err, existing) => {
                    if (existing) {
                        return res.status(400).json({ error: 'Report already shared with this user' });
                    }

                    // Check if the email belongs to a registered user
                    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
                        const sharedWithUserId = user ? user.id : null;

                        db.run(
                            `INSERT INTO shared_access (report_id, shared_by, shared_with_email, shared_with_user_id)
               VALUES (?, ?, ?, ?)`,
                            [reportId, userId, email, sharedWithUserId],
                            function (err) {
                                if (err) {
                                    return res.status(500).json({ error: 'Failed to share report' });
                                }

                                res.status(201).json({
                                    message: 'Report shared successfully',
                                    shareId: this.lastID
                                });
                            }
                        );
                    });
                }
            );
        }
    );
});

// Revoke access to a shared report
router.delete('/share/:shareId', authenticateToken, (req, res) => {
    const shareId = req.params.shareId;
    const userId = req.user.userId;

    // Verify the sharing was created by the current user
    db.get(
        'SELECT * FROM shared_access WHERE id = ? AND shared_by = ?',
        [shareId, userId],
        (err, share) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!share) {
                return res.status(404).json({ error: 'Share not found or access denied' });
            }

            db.run('DELETE FROM shared_access WHERE id = ?', [shareId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to revoke access' });
                }
                res.json({ message: 'Access revoked successfully' });
            });
        }
    );
});

// Get all reports shared with the current user
router.get('/received', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const email = req.user.email;

    db.all(
        `SELECT r.*, u.full_name as owner_name, u.email as owner_email, sa.shared_at
     FROM reports r
     INNER JOIN shared_access sa ON r.id = sa.report_id
     INNER JOIN users u ON r.user_id = u.id
     WHERE sa.shared_with_email = ? OR sa.shared_with_user_id = ?
     ORDER BY sa.shared_at DESC`,
        [email, userId],
        (err, reports) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch shared reports' });
            }
            res.json({ reports });
        }
    );
});

// Get all reports the current user has shared
router.get('/sent', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.all(
        `SELECT r.*, sa.id as share_id, sa.shared_with_email, sa.shared_at,
     u.full_name as recipient_name
     FROM reports r
     INNER JOIN shared_access sa ON r.id = sa.report_id
     LEFT JOIN users u ON sa.shared_with_user_id = u.id
     WHERE r.user_id = ?
     ORDER BY sa.shared_at DESC`,
        [userId],
        (err, shares) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch shared reports' });
            }
            res.json({ shares });
        }
    );
});

// Get sharing details for a specific report
router.get('/report/:reportId', authenticateToken, (req, res) => {
    const reportId = req.params.reportId;
    const userId = req.user.userId;

    // Verify user owns the report
    db.get(
        'SELECT * FROM reports WHERE id = ? AND user_id = ?',
        [reportId, userId],
        (err, report) => {
            if (err || !report) {
                return res.status(404).json({ error: 'Report not found or access denied' });
            }

            db.all(
                `SELECT sa.*, u.full_name as recipient_name
         FROM shared_access sa
         LEFT JOIN users u ON sa.shared_with_user_id = u.id
         WHERE sa.report_id = ?
         ORDER BY sa.shared_at DESC`,
                [reportId],
                (err, shares) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch sharing details' });
                    }
                    res.json({ shares });
                }
            );
        }
    );
});

module.exports = router;
