-- Seed mock data aligned to PMO daily pains
INSERT INTO users (email, full_name, role) VALUES
    ('pmo@lpbank.vn', 'Head of PMO', 'pmo')
ON CONFLICT DO NOTHING;

INSERT INTO meetings (title, scheduled_at, phase) VALUES
    ('Steering Committee - Core Banking', NOW(), 'pre'),
    ('Weekly Project Status - Mobile', NOW(), 'in'),
    ('Risk Review - Compliance', NOW(), 'post')
ON CONFLICT DO NOTHING;