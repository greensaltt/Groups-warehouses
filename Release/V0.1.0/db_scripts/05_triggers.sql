-- 植悟系统 - openGauss触发器创建脚本

-- 1. tri_after_care_log_insert（养护日志插入触发器）
CREATE OR REPLACE FUNCTION tri_after_care_log_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE plants SET updated_at = CURRENT_TIMESTAMP WHERE plant_id = NEW.plant_id;
    
    INSERT INTO operation_logs (user_id, operation_type, operation_detail)
    SELECT
        p.user_id,
        'care_log',
        'Added care log for plant: ' || p.nickname
    FROM plants p WHERE p.plant_id = NEW.plant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tri_after_care_log_insert
AFTER INSERT ON care_logs
FOR EACH ROW
EXECUTE FUNCTION tri_after_care_log_insert();

-- 2. tri_after_sensor_data_insert（传感器数据插入触发器）
CREATE OR REPLACE FUNCTION tri_after_sensor_data_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_plant_id BIGINT;
BEGIN
    SELECT plant_id INTO v_plant_id
    FROM sensors WHERE sensor_id = NEW.sensor_id;
    
    IF NEW.soil_moisture < 20 THEN
        PERFORM sp_generate_personalized_reminder(v_plant_id, 'watering');
    END IF;
    
    IF NEW.temperature < 5 THEN
        PERFORM sp_generate_personalized_reminder(v_plant_id, 'temperature');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tri_after_sensor_data_insert
AFTER INSERT ON sensor_data
FOR EACH ROW
EXECUTE FUNCTION tri_after_sensor_data_insert();