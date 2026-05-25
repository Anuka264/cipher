const db = require('../config/db');

exports.getMatches = async (req, res) => {
    const { userEmbedding, intensityPreference } = req.body; 

    try {
        const query = `
            SELECT id, name, intensity_level, 
            ROUND((1 - (traits <-> $1))::numeric * 100, 2) AS match_percentage
            FROM users
            WHERE id != $2
            ORDER BY 
                (intensity_level = $3) DESC, -- Matches intensity first
                traits <-> $1 ASC           -- Then sorts by closest AI embedding
            LIMIT 10;
        `;

        const values = [userEmbedding, req.user.id, intensityPreference];
        const { rows } = await db.query(query, values);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Matching failed" });
    }
};