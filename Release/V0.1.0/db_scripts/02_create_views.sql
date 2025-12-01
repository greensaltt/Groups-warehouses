-- 植悟系统 - openGauss数据库视图创建脚本

-- 1. view_plant_care_summary（植物养护概览视图）
CREATE OR REPLACE VIEW view_plant_care_summary AS
SELECT
    p.plant_id,
    p.nickname,
    p.personality_signature,
    pt.name AS plant_type,
    COUNT(cl.log_id) AS care_count,
    MAX(cl.care_date) AS last_care_date,
    COUNT(CASE WHEN r.is_completed = false THEN 1 END) AS pending_reminders
FROM plants p
LEFT JOIN plant_types pt ON p.plant_type_id = pt.plant_type_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
LEFT JOIN reminders r ON p.plant_id = r.plant_id
GROUP BY p.plant_id, p.nickname, p.personality_signature, pt.name;

-- 2. view_user_plant_summary（用户植物概览视图）
CREATE OR REPLACE VIEW view_user_plant_summary AS
SELECT
    u.user_id,
    u.username,
    COUNT(p.plant_id) as total_plants,
    COUNT(CASE WHEN p.status = 'healthy' THEN 1 END) as healthy_plants,
    COUNT(CASE WHEN r.is_completed = false THEN 1 END) as pending_reminders,
    MAX(cl.care_date) as last_care_date
FROM users u
LEFT JOIN plants p ON u.user_id = p.user_id
LEFT JOIN reminders r ON p.plant_id = r.plant_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
GROUP BY u.user_id, u.username;

-- 3. view_sensor_monitoring（传感器监控视图）
CREATE OR REPLACE VIEW view_sensor_monitoring AS
SELECT
    s.sensor_id,
    s.device_name,
    s.connection_status,
    s.battery_level,
    p.nickname as plant_nickname,
    sd.soil_moisture,
    sd.temperature,
    sd.humidity,
    sd.light_intensity,
    sd.recorded_at
FROM sensors s
LEFT JOIN plants p ON s.plant_id = p.plant_id
LEFT JOIN sensor_data sd ON s.sensor_id = sd.sensor_id
WHERE sd.recorded_at = (SELECT MAX(recorded_at) FROM sensor_data WHERE sensor_id = s.sensor_id);

-- 4. 植物详细统计视图
CREATE OR REPLACE VIEW view_plant_detailed_stats AS
SELECT
    p.plant_id,
    p.nickname,
    pt.name as plant_type,
    u.username as owner,
    p.plant_date,
    EXTRACT(DAY FROM (CURRENT_DATE - p.plant_date)) as age_days,
    COUNT(DISTINCT cl.log_id) as total_care_actions,
    COUNT(DISTINCT pi.image_id) as total_photos,
    MAX(cl.care_date) as last_care_date,
    p.status
FROM plants p
JOIN plant_types pt ON p.plant_type_id = pt.plant_type_id
JOIN users u ON p.user_id = u.user_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
LEFT JOIN plant_images pi ON p.plant_id = pi.plant_id
GROUP BY p.plant_id, p.nickname, pt.name, u.username, p.plant_date, p.status;

-- 5. 用户活动统计视图
CREATE OR REPLACE VIEW view_user_activity_summary AS
SELECT
    u.user_id,
    u.username,
    COUNT(DISTINCT p.plant_id) as plant_count,
    COUNT(DISTINCT cl.log_id) as care_log_count,
    COUNT(DISTINCT r.reminder_id) as reminder_count,
    COUNT(DISTINCT ac.conversation_id) as ai_chat_count,
    MAX(cl.care_date) as last_care_activity,
    MAX(ac.created_at) as last_ai_chat
FROM users u
LEFT JOIN plants p ON u.user_id = p.user_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
LEFT JOIN reminders r ON p.plant_id = r.plant_id
LEFT JOIN ai_conversations ac ON u.user_id = ac.user_id
GROUP BY u.user_id, u.username;-- 植悟系统 - openGauss数据库视图创建脚本

-- 1. view_plant_care_summary（植物养护概览视图）
CREATE OR REPLACE VIEW view_plant_care_summary AS
SELECT
    p.plant_id,
    p.nickname,
    p.personality_signature,
    pt.name AS plant_type,
    COUNT(cl.log_id) AS care_count,
    MAX(cl.care_date) AS last_care_date,
    COUNT(CASE WHEN r.is_completed = false THEN 1 END) AS pending_reminders
FROM plants p
LEFT JOIN plant_types pt ON p.plant_type_id = pt.plant_type_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
LEFT JOIN reminders r ON p.plant_id = r.plant_id
GROUP BY p.plant_id, p.nickname, p.personality_signature, pt.name;

-- 2. view_user_plant_summary（用户植物概览视图）
CREATE OR REPLACE VIEW view_user_plant_summary AS
SELECT
    u.user_id,
    u.username,
    COUNT(p.plant_id) as total_plants,
    COUNT(CASE WHEN p.status = 'healthy' THEN 1 END) as healthy_plants,
    COUNT(CASE WHEN r.is_completed = false THEN 1 END) as pending_reminders,
    MAX(cl.care_date) as last_care_date
FROM users u
LEFT JOIN plants p ON u.user_id = p.user_id
LEFT JOIN reminders r ON p.plant_id = r.plant_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
GROUP BY u.user_id, u.username;

-- 3. view_sensor_monitoring（传感器监控视图）
CREATE OR REPLACE VIEW view_sensor_monitoring AS
SELECT
    s.sensor_id,
    s.device_name,
    s.connection_status,
    s.battery_level,
    p.nickname as plant_nickname,
    sd.soil_moisture,
    sd.temperature,
    sd.humidity,
    sd.light_intensity,
    sd.recorded_at
FROM sensors s
LEFT JOIN plants p ON s.plant_id = p.plant_id
LEFT JOIN sensor_data sd ON s.sensor_id = sd.sensor_id
WHERE sd.recorded_at = (SELECT MAX(recorded_at) FROM sensor_data WHERE sensor_id = s.sensor_id);

-- 4. 植物详细统计视图
CREATE OR REPLACE VIEW view_plant_detailed_stats AS
SELECT
    p.plant_id,
    p.nickname,
    pt.name as plant_type,
    u.username as owner,
    p.plant_date,
    EXTRACT(DAY FROM (CURRENT_DATE - p.plant_date)) as age_days,
    COUNT(DISTINCT cl.log_id) as total_care_actions,
    COUNT(DISTINCT pi.image_id) as total_photos,
    MAX(cl.care_date) as last_care_date,
    p.status
FROM plants p
JOIN plant_types pt ON p.plant_type_id = pt.plant_type_id
JOIN users u ON p.user_id = u.user_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
LEFT JOIN plant_images pi ON p.plant_id = pi.plant_id
GROUP BY p.plant_id, p.nickname, pt.name, u.username, p.plant_date, p.status;

-- 5. 用户活动统计视图
CREATE OR REPLACE VIEW view_user_activity_summary AS
SELECT
    u.user_id,
    u.username,
    COUNT(DISTINCT p.plant_id) as plant_count,
    COUNT(DISTINCT cl.log_id) as care_log_count,
    COUNT(DISTINCT r.reminder_id) as reminder_count,
    COUNT(DISTINCT ac.conversation_id) as ai_chat_count,
    MAX(cl.care_date) as last_care_activity,
    MAX(ac.created_at) as last_ai_chat
FROM users u
LEFT JOIN plants p ON u.user_id = p.user_id
LEFT JOIN care_logs cl ON p.plant_id = cl.plant_id
LEFT JOIN reminders r ON p.plant_id = r.plant_id
LEFT JOIN ai_conversations ac ON u.user_id = ac.user_id
GROUP BY u.user_id, u.username;