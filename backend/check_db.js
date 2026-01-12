const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./health_wallet.db');

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Tables:', tables);
        }
    });

    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Users:', rows);
        }
    });
});

db.close();
