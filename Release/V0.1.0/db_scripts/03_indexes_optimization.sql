-- 植悟系统 - openGauss数据库索引优化脚本

-- users表索引优化
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_city);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(is_deleted, created_at);

-- plants表索引优化
CREATE INDEX IF NOT EXISTS idx_plants_plant_date ON plants(plant_date);
CREATE INDEX IF NOT EXISTS idx_plants_created ON plants(created_at);
CREATE INDEX IF NOT EXISTS idx_plants_type_status ON plants(plant_type_id, status);
CREATE INDEX IF NOT EXISTS idx_plants_user_date ON plants(user_id, plant_date);

-- care_logs表索引优化
CREATE INDEX IF NOT EXISTS idx_care_logs_type_date ON care_logs(care_type, care_date);
CREATE INDEX IF NOT EXISTS idx_care_logs_created ON care_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_care_logs_plant_type ON care_logs(plant_id, care_type, care_date);

-- reminders表索引优化
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_at, is_completed);
CREATE INDEX IF NOT EXISTS idx_reminders_user_status ON reminders(user_id, is_completed, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_urgent ON reminders(is_urgent, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed_at);

-- sensor_data表索引优化
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(recorded_at);
CREATE INDEX IF NOT EXISTS idx_sensor_data_values ON sensor_data(soil_moisture, temperature, humidity);
CREATE INDEX IF NOT EXISTS idx_sensor_data_plant ON sensor_data(sensor_id, recorded_at);

-- ai_conversations表索引优化
CREATE INDEX IF NOT EXISTS idx_ai_conversations_plant ON ai_conversations(plant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_type ON ai_conversations(message_type, created_at);

-- operation_logs表索引优化
CREATE INDEX IF NOT EXISTS idx_operation_logs_type ON operation_logs(operation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_type ON operation_logs(user_id, operation_type, created_at);

-- weather_data表索引优化
CREATE INDEX IF NOT EXISTS idx_weather_city_date ON weather_data(location_city, recorded_at);
CREATE INDEX IF NOT EXISTS idx_weather_temperature ON weather_data(temperature, recorded_at);

-- 全文索引（openGauss使用GIN索引替代）
CREATE INDEX IF NOT EXISTS ft_plant_nickname ON plants USING gin(to_tsvector('simple', nickname || ' ' || COALESCE(personality_signature, '')));
CREATE INDEX IF NOT EXISTS ft_plant_name ON plant_types USING gin(to_tsvector('simple', name || ' ' || COALESCE(scientific_name, '') || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS ft_care_notes ON care_logs USING gin(to_tsvector('simple', COALESCE(notes, '')));

-- 复合索引优化
CREATE INDEX IF NOT EXISTS idx_plants_user_status_date ON plants(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_plant_status ON reminders(user_id, plant_id, is_completed, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_care_logs_plant_date_type ON care_logs(plant_id, care_date, care_type);