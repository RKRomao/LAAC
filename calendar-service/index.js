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

const TICKET_SERVICE_URL = process.env.TICKET_SERVICE_URL || 'http://ticket-service:8016';

app.get('/calendar/:academic_year', async (req, res) => {
    let { academic_year } = req.params;
    academic_year = decodeURIComponent(academic_year);
    // academic_year is often in format "2025" or "2025-2026"
    // For now we will fetch all tickets and return the ones matching the year, or just all tickets grouped.
    
    try {
        // Fetch tickets from the ticket service (acting as reports)
        const response = await axios.get(`${TICKET_SERVICE_URL}/tickets`);
        const tickets = response.data;

        const result = {};

        tickets.forEach(ticket => {
            const date = moment(ticket.created_at);
            const monthName = date.format('MMMM');
            const day = date.date();
            const year = date.year();
            
            const yearKey = `Ano ${year}`;

            if (!result[yearKey]) {
                result[yearKey] = {};
            }

            if (!result[yearKey][monthName]) {
                result[yearKey][monthName] = {};
            }

            if (!result[yearKey][monthName][day]) {
                result[yearKey][monthName][day] = [];
            }

            // We indicate the error report in the calendar
            result[yearKey][monthName][day].push({
                id: ticket.id,
                title: ticket.title,
                type: ticket.type,
                status: ticket.status,
                description: ticket.description,
                assigned_team: ticket.assigned_team,
                full_date: date.format('YYYY-MM-DD HH:mm:ss')
            });
        });

        res.json(result);
    } catch (error) {
        console.error('Calendar Reports Error:', error.message);
        res.status(500).json({ error: 'Erro ao carregar tickets para o calendário', details: error.message });
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


// Endpoint to report schedule problems (forwards to ticket-service)
app.post('/reports/schedule', async (req, res) => {
    const { user_id, class_id, subject_name, description, academic_year } = req.body;
    const authorization = req.headers['authorization'];

    try {
        // Create a ticket in the ticket-service
        const ticketData = {
            type: 'schedule',
            title: `Problema no Calendário: ${subject_name || 'Aula'}`,
            description: `Class ID: ${class_id || 'N/A'}\nAno Académico: ${academic_year || 'N/A'}\n\nDescrição do utilizador: ${description}`,
            assigned_team: 'Academic'
        };

        const response = await axios.post(`${TICKET_SERVICE_URL}/tickets`, ticketData, {
            headers: { 'Authorization': authorization }
        });

        res.status(201).json({ 
            message: 'Problema no calendário reportado como ticket', 
            ticket_id: response.data.id 
        });
    } catch (error) {
        console.error('Error forwarding schedule report:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Erro ao criar ticket de calendário', 
            details: error.response?.data?.detail || error.message 
        });
    }
});



const PORT = process.env.PORT || 8011;
app.listen(PORT, () => {
    console.log(`Calendar Service running on port ${PORT} with dedicated DB`);
});
