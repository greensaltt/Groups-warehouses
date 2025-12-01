-- 植悟系统 - openGauss数据库表结构创建脚本

-- users（用户表）
CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  location_city VARCHAR(100),
  notification_preferences TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_users_location ON users(location_city);
CREATE INDEX idx_users_status ON users(is_deleted, created_at);

-- plant_types（植物种类表）
CREATE TABLE IF NOT EXISTS plant_types (
  plant_type_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  scientific_name VARCHAR(100),
  water_freq_days INTEGER NOT NULL DEFAULT 7,
  light_need VARCHAR(50) NOT NULL,
  optimal_temperature VARCHAR(50),
  description TEXT,
  care_instructions TEXT
);

-- plants（植物表）
CREATE TABLE IF NOT EXISTS plants (
  plant_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  plant_type_id INTEGER NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  personality_signature VARCHAR(255),
  plant_date DATE NOT NULL,
  initial_photo_url VARCHAR(255),
  location VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'healthy',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plants_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_plants_plant_type FOREIGN KEY (plant_type_id) REFERENCES plant_types(plant_type_id)
);

CREATE INDEX fk_plants_user ON plants(user_id);
CREATE INDEX fk_plants_plant_type ON plants(plant_type_id);
CREATE INDEX idx_user_status ON plants(user_id, status);

-- care_logs（养护日志表）
CREATE TABLE IF NOT EXISTS care_logs (
  log_id BIGSERIAL PRIMARY KEY,
  plant_id BIGINT NOT NULL,
  care_type VARCHAR(50) NOT NULL,
  care_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  image_url VARCHAR(255),
  weather_condition VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_care_logs_plant FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
);

CREATE INDEX fk_care_logs_plant ON care_logs(plant_id);
CREATE INDEX idx_plant_care_date ON care_logs(plant_id, care_date);

-- reminders（提醒任务表）
CREATE TABLE IF NOT EXISTS reminders (
  reminder_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  plant_id BIGINT NOT NULL,
  reminder_type VARCHAR(50) NOT NULL,
  reminder_content TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  trigger_condition VARCHAR(100),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reminders_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_reminders_plant FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
);

CREATE INDEX fk_reminders_user ON reminders(user_id);
CREATE INDEX fk_reminders_plant ON reminders(plant_id);
CREATE INDEX idx_user_scheduled ON reminders(user_id, scheduled_at);
CREATE INDEX idx_is_completed ON reminders(is_completed);

