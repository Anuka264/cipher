const db = require('../config/db');

const User = {
    create: async (username, email, passwordHash) => {
        const query = `
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3) RETURNING *`;
        const values = [username, email, passwordHash];
        const { rows } = await db.query(query, values);
        return rows[0];
    },

    findByEmail: async (email) => {
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0];
    }
};

module.exports = User;