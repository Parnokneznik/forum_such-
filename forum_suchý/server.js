const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./forum.db', (err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
    } else {
        console.log('Connected to the forum database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS posts (
                post_id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS comments (
                comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                parent_comment_id INTEGER,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(post_id),
                FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id)
            )
        `);
    }
});

function getNestedComments(postId, callback) {
    db.all(`SELECT comment_id, post_id, parent_comment_id, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC`, [postId], (err, rows) => {
        if (err) {
            return callback(err, null);
        }

        const commentMap = new Map();
        const topLevelComments = [];

        rows.forEach(row => {
            commentMap.set(row.comment_id, { ...row, replies: [] });
        });

        rows.forEach(row => {
            if (row.parent_comment_id === null) {
                topLevelComments.push(commentMap.get(row.comment_id));
            } else {
                const parent = commentMap.get(row.parent_comment_id);
                if (parent) {
                    parent.replies.push(commentMap.get(row.comment_id));
                }
            }
        });

        callback(null, topLevelComments);
    });
}

app.get('/api/posts', (req, res) => {
    const sortBy = req.query.sortBy;
    let sql = `SELECT p.*, COUNT(c.comment_id) AS comment_count FROM posts p LEFT JOIN comments c ON p.post_id = c.post_id GROUP BY p.post_id`;
    let orderBy = '';

    if (sortBy === 'comments') {
        orderBy = 'ORDER BY comment_count DESC';
    } else {
        orderBy = 'ORDER BY p.created_at DESC';
    }

    db.all(`${sql} ${orderBy}`, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(rows);
    });
});

app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).send('Title and content are required.');
    }
    db.run(`INSERT INTO posts (title, content) VALUES (?, ?)`, [title, content], function(err) {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.status(201).json({ postId: this.lastID, message: 'Post created successfully!' });
    });
});

app.get('/api/posts/:post_id', (req, res) => {
    const postId = req.params.post_id;
    db.get(`SELECT * FROM posts WHERE post_id = ?`, [postId], (err, post) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (!post) {
            res.status(404).send('Post not found.');
            return;
        }
        getNestedComments(postId, (err, comments) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json({ post, comments });
        });
    });
});

app.post('/api/posts/:post_id/comments', (req, res) => {
    const postId = req.params.post_id;
    const { content, parentCommentId } = req.body;
    if (!content) {
        return res.status(400).send('Comment content is required.');
    }

    db.get(`SELECT * FROM posts WHERE post_id = ?`, [postId], (err, post) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (!post) {
            res.status(404).send('Post not found.');
            return;
        }

        db.run(`INSERT INTO comments (post_id, parent_comment_id, content) VALUES (?, ?, ?)`, [postId, parentCommentId || null, content], function(err) {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.status(201).json({ commentId: this.lastID, message: 'Comment added successfully!' });
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});