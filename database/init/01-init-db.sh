#!/bin/bash
set -e

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
    CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON support_tickets(created_by);
    
    -- Create spatial index for locations
    CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST (coordinates);
    
    -- Create full-text search indexes
    CREATE INDEX IF NOT EXISTS idx_faqs_search ON faqs USING gin(to_tsvector('english', question || ' ' || answer));
    CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || description));
    CREATE INDEX IF NOT EXISTS idx_locations_search ON locations USING gin(to_tsvector('english', name || ' ' || description || ' ' || address));
    
    -- Create trigger to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    \$\$ language 'plpgsql';
    
    -- Apply the trigger to all tables with updated_at column
    DO \$\$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'updated_at') THEN
            CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'updated_at') THEN
            CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'updated_at') THEN
            CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'updated_at') THEN
            CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END \$\$;
    
    -- Create view for active events
    CREATE OR REPLACE VIEW active_events AS
    SELECT 
        e.*,
        u.name as creator_name,
        CASE 
            WHEN e.start_date > CURRENT_TIMESTAMP THEN 'upcoming'
            WHEN e.end_date < CURRENT_TIMESTAMP THEN 'past'
            ELSE 'ongoing'
        END as event_status
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.is_active = true;
    
    -- Create view for open support tickets
    CREATE OR REPLACE VIEW open_tickets AS
    SELECT 
        st.*,
        u.name as user_name,
        u.email as user_email,
        assigned.name as assigned_name
    FROM support_tickets st
    LEFT JOIN users u ON st.created_by = u.id
    LEFT JOIN users assigned ON st.assigned_to = assigned.id
    WHERE st.status IN ('open', 'in_progress')
    ORDER BY st.priority DESC, st.created_at ASC;
    
    -- Create function for full-text search
    CREATE OR REPLACE FUNCTION search_faqs(search_term TEXT)
    RETURNS TABLE(id UUID, question TEXT, answer TEXT, category TEXT, rank REAL) AS \$\$
    BEGIN
        RETURN QUERY
        SELECT 
            f.id,
            f.question,
            f.answer,
            f.category,
            ts_rank(to_tsvector('english', f.question || ' ' || f.answer), plainto_tsquery('english', search_term)) as rank
        FROM faqs f
        WHERE 
            f.is_active = true
            AND to_tsvector('english', f.question || ' ' || f.answer) @@ plainto_tsquery('english', search_term)
        ORDER BY rank DESC;
    END;
    \$\$ LANGUAGE plpgsql;
    
    -- Create function for nearby locations
    CREATE OR REPLACE FUNCTION get_nearby_locations(lat FLOAT, lng FLOAT, radius_km INTEGER DEFAULT 5)
    RETURNS TABLE(id UUID, name TEXT, address TEXT, category TEXT, distance_km FLOAT) AS \$\$
    BEGIN
        RETURN QUERY
        SELECT 
            l.id,
            l.name,
            l.address,
            l.category,
            ST_Distance(l.coordinates, ST_MakePoint(lng, lat)::geography) / 1000 as distance_km
        FROM locations l
        WHERE 
            l.is_active = true
            AND ST_DWithin(l.coordinates, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
        ORDER BY distance_km;
    END;
    \$\$ LANGUAGE plpgsql;
    
    -- Create sample data (only in development)
    IF '$POSTGRES_DB' LIKE '%dev%' OR '$POSTGRES_DB' LIKE '%test%' THEN
        -- Insert sample user (admin)
        INSERT INTO users (id, name, email, password, role, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Admin User',
            'admin@laac.pt',
            '$2b$10$rOzJqQjQjQjQjQjQjQjQu', -- password: admin123
            'admin',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) ON CONFLICT (email) DO NOTHING;
        
        -- Insert sample categories
        INSERT INTO faqs (id, question, answer, category, order, is_active, created_by, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), 'Como me inscrevo na LAAC?', 'Para se inscrever na LAAC, visite o nosso site e preencha o formulário de inscrição. Também pode visitar-nos pessoalmente na nossa sede.', 'Inscrição', 1, true, (SELECT id FROM users WHERE email = 'admin@laac.pt' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), 'Quais são os benefícios de ser membro?', 'Como membro da LAAC, terá acesso a eventos exclusivos, suporte personalizado, descontos em parceiros locais e muito mais.', 'Benefícios', 2, true, (SELECT id FROM users WHERE email = 'admin@laac.pt' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
        
        -- Insert sample location
        INSERT INTO locations (id, name, description, address, coordinates, category, is_active, created_by, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Sede da LAAC',
            'A nossa sede principal onde realizamos a maioria dos eventos e atendimentos.',
            'Universidade da Covilhã, Edifício Central, 6200-001 Covilhã',
            ST_MakePoint(-7.5049, 40.2818)::geography,
            'Sede',
            true,
            (SELECT id FROM users WHERE email = 'admin@laac.pt' LIMIT 1),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Grant permissions to the application user
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $POSTGRES_USER;
    
    -- Output success message
    SELECT 'Database initialization completed successfully!' as message;
EOSQL

echo "Database initialization completed!"
