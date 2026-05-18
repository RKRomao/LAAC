const express = require('express');
const mysql = require('mysql2/promise');
const moment = require('moment');
const axios = require('axios');
require('moment/locale/pt');
moment.locale('pt');
const classDates = require('./ClassDates/index.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'calendar-mariadb',
    user: process.env.DB_USER || 'laac_user',
    password: process.env.DB_PASS || 'laac_pass',
    database: process.env.DB_NAME || 'laac_calendar_db'
};

const ACADEMIC_SERVICE_URL = process.env.ACADEMIC_SERVICE_URL || 'http://academic-service:3001';

async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

// Helper to fetch subject name
async function getSubjectNames(subjectIds) {
    try {
        if (!subjectIds || subjectIds.length === 0) return {};
        // Fetch all subjects (or filter if academic-service supports it)
        const response = await axios.get(`${ACADEMIC_SERVICE_URL}/subjects`);
        const subjects = response.data;
        const map = {};
        subjects.forEach(s => {
            if (subjectIds.includes(s.id)) {
                map[s.id] = s.name;
            }
        });
        return map;
    } catch (error) {
        console.error('Error fetching subjects:', error.message);
        return {};
    }
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

        // 2. Get all classes
        const [classes] = await connection.execute('SELECT * FROM classes');
        
        // 3. Fetch subject names from academic service
        const subjectIds = [...new Set(classes.map(c => c.subject_id))];
        const subjectMap = await getSubjectNames(subjectIds);

        const result = {};

        for (const semester of semesters) {
            const semKey = `Semestre ${semester.semester_number}`;
            result[semKey] = {};

            const startDate = moment(semester.start_date).format('YYYY-MM-DD');
            const endDate = moment(semester.end_date).format('YYYY-MM-DD');

            if (classes.length === 0) {
                const firstMonth = moment(startDate).format('MMMM');
                result[semKey][firstMonth] = {};
            }

            for (const cls of classes) {
                const dates = classDates.generate({
                    format: 'YYYY-MM-DD',
                    start: startDate,
                    end: endDate,
                    weekday: cls.weekday,
                    breaks: []
                });

                if (dates && dates.length > 0) {
                    dates.forEach(date => {
                        const monthName = date.format('MMMM');
                        const day = date.date();
                        const dateStr = date.format('YYYY-MM-DD');

                        if (!result[semKey][monthName]) {
                            result[semKey][monthName] = {};
                        }

                        if (!result[semKey][monthName][day]) {
                            result[semKey][monthName][day] = [];
                        }

                        result[semKey][monthName][day].push({
                            subject: subjectMap[cls.subject_id] || `Subject ${cls.subject_id}`,
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

app.get('/classes', async (req, res) => {
    const { course_id, curricular_year } = req.query;
    let connection;
    try {
        connection = await getDbConnection();
        // Since subjects are in another service, we first fetch relevant subject IDs
        let subjectIds = [];
        if (course_id || curricular_year) {
            const subjectsRes = await axios.get(`${ACADEMIC_SERVICE_URL}/subjects`, {
                params: { course_id, curricular_year }
            });
            subjectIds = subjectsRes.data.map(s => s.id);
        }

        let query = 'SELECT * FROM classes WHERE 1=1';
        let params = [];
        if (subjectIds.length > 0) {
            query += ` AND subject_id IN (${subjectIds.join(',')})`;
        } else if (course_id || curricular_year) {
            // No subjects found for these filters
            return res.json([]);
        }
        
        const [classes] = await connection.execute(query, params);
        
        // Enrich with subject names
        const allSubjectIds = [...new Set(classes.map(c => c.subject_id))];
        const subjectMap = await getSubjectNames(allSubjectIds);
        
        const enrichedClasses = classes.map(c => ({
            ...c,
            subject_name: subjectMap[c.subject_id] || `Subject ${c.subject_id}`
        }));

        res.json(enrichedClasses);
    } catch (error) {
        console.error('ERROR in GET /classes:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});


// Endpoint to report schedule problems
app.post('/reports/schedule', async (req, res) => {
    const { user_id, class_id, subject_name, description } = req.body;
    let connection;
    try {
        connection = await getDbConnection();
        await connection.execute(
            'INSERT INTO schedule_reports (user_id, class_id, subject_name, description) VALUES (?, ?, ?, ?)',
            [user_id || 0, class_id || null, subject_name || null, description]
        );
        res.status(201).json({ message: 'Problema reportado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// Endpoint to view reports (for staff)
app.get('/reports/schedule', async (req, res) => {
    let connection;
    try {
        connection = await getDbConnection();
        const [reports] = await connection.execute('SELECT * FROM schedule_reports ORDER BY created_at DESC');
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});



const PORT = process.env.PORT || 8011;
app.listen(PORT, () => {
    console.log(`Calendar Service running on port ${PORT} with dedicated DB`);
});
