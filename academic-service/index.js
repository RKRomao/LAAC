const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'laac-mariadb',
    user: process.env.DB_USER || 'laac_user',
    password: process.env.DB_PASS || 'laac_pass',
    database: process.env.DB_NAME || 'laac_db'
};

async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

// GET /courses
app.get('/courses', async (req, res) => {
    const { study_cycle } = req.query;
    console.log(`DEBUG: Academic Service received request for /courses?study_cycle=${study_cycle}`);
    let connection;
    try {
        connection = await getDbConnection();
        let query = 'SELECT * FROM courses';
        let params = [];
        if (study_cycle) {
            query += ' WHERE study_cycle = ?';
            params.push(study_cycle);
        }
        query += ' ORDER BY name';
        const [rows] = await connection.execute(query, params);
        console.log(`DEBUG: Found ${rows.length} courses for cycle ${study_cycle}`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /subjects
app.get('/subjects', async (req, res) => {
    const { course_id, curricular_year } = req.query;
    let connection;
    try {
        connection = await getDbConnection();
        let query = 'SELECT s.* FROM subjects s WHERE 1=1';
        let params = [];
        if (course_id) {
            query += ' AND s.course_id = ?';
            params.push(course_id);
        }
        if (curricular_year) {
            query += ' AND s.curricular_year = ?';
            params.push(curricular_year);
        }
        query += ' ORDER BY name';
        console.log(`DEBUG: Subjects Query: ${query} with params:`, params);
        const [subjects] = await connection.execute(query, params);
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Academic Service running on port ${PORT}`);
});
