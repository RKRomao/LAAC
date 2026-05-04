const express = require('express');
const mysql = require('mysql2/promise');
const moment = require('moment');
require('moment/locale/pt');
moment.locale('pt');
const classDates = require('./ClassDates/index.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'mariadb',
    user: process.env.DB_USER || 'laac_user',
    password: process.env.DB_PASS || 'laac_pass',
    database: process.env.DB_NAME || 'laac_db'
};

async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

app.get('/calendar/:academic_year', async (req, res) => {
    let { academic_year } = req.params;
    academic_year = decodeURIComponent(academic_year);
    let connection;

    try {
        connection = await getDbConnection();

        // 1. Get semesters for this academic year
        let [semesters] = await connection.execute(
            'SELECT * FROM semesters WHERE academic_year = ? ORDER BY semester_number',
            [academic_year]
        );

        // Fallback: If no semesters in DB, use default academic dates
        if (semesters.length === 0) {
            console.log(`DEBUG: No data for ${academic_year}, using fallback defaults.`);
            semesters = [
                { semester_number: 1, start_date: '2025-09-15', end_date: '2026-01-31' },
                { semester_number: 2, start_date: '2026-02-16', end_date: '2026-06-30' }
            ];
        }

        // 2. Get all classes for these subjects
        const [classes] = await connection.execute(`
            SELECT c.*, s.name as subject_name 
            FROM classes c
            JOIN subjects s ON c.subject_id = s.id
        `);

        const result = {};

        for (const semester of semesters) {
            const semKey = `Semestre ${semester.semester_number}`;
            result[semKey] = {};

            const startDate = moment(semester.start_date).format('YYYY-MM-DD');
            const endDate = moment(semester.end_date).format('YYYY-MM-DD');

            // If no classes exist, we still want to show the structure if needed
            if (classes.length === 0) {
                // Initialize at least the first month of the semester to show structure
                const firstMonth = moment(startDate).format('MMMM');
                result[semKey][firstMonth] = {};
            }

            for (const cls of classes) {
                // Generate dates for this class in this semester
                const dates = classDates.generate({
                    format: 'YYYY-MM-DD',
                    start: startDate,
                    end: endDate,
                    weekday: cls.weekday,
                    breaks: [] // Can be extended if breaks are added to DB
                });

                if (dates && dates.length > 0) {
                    dates.forEach(date => {
                        const monthName = date.format('MMMM'); // e.g., "September"
                        const day = date.date();
                        const dateStr = date.format('YYYY-MM-DD');

                        if (!result[semKey][monthName]) {
                            result[semKey][monthName] = {};
                        }

                        if (!result[semKey][monthName][day]) {
                            result[semKey][monthName][day] = [];
                        }

                        result[semKey][monthName][day].push({
                            subject: cls.subject_name,
                            type: cls.type,
                            start_time: cls.start_time,
                            end_time: cls.end_time,
                            location_id: cls.location_id,
                            full_date: dateStr
                        });
                    });
                }
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Calendar Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// Get classes filtered by course and year
app.get('/classes', async (req, res) => {
    const { course_id, curricular_year } = req.query;
    let connection;
    try {
        connection = await getDbConnection();
        let query = `
            SELECT c.*, s.name as subject_name 
            FROM classes c
            JOIN subjects s ON c.subject_id = s.id
            WHERE 1=1
        `;
        let params = [];
        if (course_id) {
            query += ' AND s.course_id = ?';
            params.push(course_id);
        }
        if (curricular_year) {
            query += ' AND s.curricular_year = ?';
            params.push(curricular_year);
        }
        
        const [classes] = await connection.execute(query, params);
        console.log(`DEBUG: Found ${classes.length} classes for course ${course_id} year ${curricular_year}`);
        res.json(classes);
    } catch (error) {
        console.error('ERROR in GET /classes:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// Delete a class schedule
app.delete('/classes/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getDbConnection();
        await connection.execute('DELETE FROM classes WHERE id = ?', [id]);
        res.json({ message: 'Aula removida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// Create a new class schedule
app.post('/classes', async (req, res) => {
    const { subject_id, weekday, start_time, end_time, type, location_id } = req.body;
    let connection;
    try {
        connection = await getDbConnection();
        const [result] = await connection.execute(
            'INSERT INTO classes (subject_id, weekday, start_time, end_time, type, location_id) VALUES (?, ?, ?, ?, ?, ?)',
            [subject_id, weekday, start_time, end_time, type, location_id || null]
        );
        res.status(201).json({ message: 'Aula marcada com sucesso', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = process.env.PORT || 8011;
app.listen(PORT, () => {
    console.log(`Calendar Service running on port ${PORT}`);
});
