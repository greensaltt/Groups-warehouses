-- 植悟系统 - openGauss存储过程创建脚本

-- 1. sp_create_reminder_for_plant（创建植物提醒）
CREATE OR REPLACE FUNCTION sp_create_reminder_for_plant(
    p_plant_id BIGINT,
    p_reminder_type VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO reminders (plant_id, user_id, reminder_type, scheduled_at, is_completed)
    SELECT
        p_plant_id,
        p.user_id,
        p_reminder_type,
        CURRENT_TIMESTAMP + (pt.water_freq_days || ' days')::INTERVAL,
        false
    FROM plants p
    JOIN plant_types pt ON p.plant_type_id = pt.plant_type_id
    WHERE p.plant_id = p_plant_id;
END;
$$ LANGUAGE plpgsql;

-- 2. sp_generate_personalized_reminder（生成个性化提醒）
CREATE OR REPLACE FUNCTION sp_generate_personalized_reminder(
    p_plant_id BIGINT,
    p_reminder_type VARCHAR(50)
)
RETURNS VOID AS $$
DECLARE
    v_plant_nickname VARCHAR(100);
    v_user_id BIGINT;
    v_reminder_content TEXT;
BEGIN
    SELECT nickname, user_id INTO v_plant_nickname, v_user_id
    FROM plants WHERE plant_id = p_plant_id;
    
    CASE p_reminder_type
        WHEN 'watering' THEN
            v_reminder_content := '嗨主人，我是' || v_plant_nickname || '！我嗓子快冒烟啦，求喂水！';
        WHEN 'temperature' THEN
            v_reminder_content := '救命啊！我是' || v_plant_nickname || '，外面好冷啊，快把我搬进屋里吧！';
        ELSE
            v_reminder_content := '主人，我是' || v_plant_nickname || '，我需要你的照顾哦！';
    END CASE;
    
    INSERT INTO reminders (user_id, plant_id, reminder_type, reminder_content, scheduled_at, is_completed)
    VALUES (v_user_id, p_plant_id, p_reminder_type, v_reminder_content, CURRENT_TIMESTAMP, false);
END;
$$ LANGUAGE plpgsql;