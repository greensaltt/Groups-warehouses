-- 植悟系统 - openGauss初始数据插入脚本

-- 插入植物种类数据
INSERT INTO plant_types (name, scientific_name, water_freq_days, light_need, optimal_temperature, description) VALUES 
('绿萝', 'Epipremnum aureum', 7, '半阴', '18-25°C', '适应性强，适合室内养护，空气净化效果好'),
('仙人掌', 'Cactaceae', 30, '全日照', '15-30°C', '耐旱植物，需少量浇水，喜欢阳光充足环境'),
('多肉植物', 'Succulent plants', 14, '充足光照', '10-25°C', '叶片储水，避免积水，适合新手养护'),
('吊兰', 'Chlorophytum comosum', 5, '半阴', '15-25°C', '空气净化能力强，生长快速，易繁殖'),
('芦荟', 'Aloe vera', 10, '充足光照', '20-30°C', '药用价值高，喜温暖干燥环境'),
('龟背竹', 'Monstera deliciosa', 7, '半阴', '18-27°C', '热带观叶植物，喜欢湿润环境'),
('富贵竹', 'Dracaena sanderiana', 10, '散射光', '16-25°C', '水培植物，寓意吉祥，易养护'),
('文竹', 'Asparagus setaceus', 5, '散射光', '15-25°C', '观赏性强，需要保持土壤湿润'),
('虎皮兰', 'Sansevieria trifasciata', 20, '耐阴', '16-30°C', '极其耐旱，空气净化能力强'),
('君子兰', 'Clivia miniata', 10, '散射光', '15-25°C', '花期长，观赏价值高')
ON CONFLICT (name) DO NOTHING;

-- 插入系统配置数据
INSERT INTO system_config (config_key, config_value, description) VALUES 
('system_name', '"植悟(FloraMind)"', '系统名称'),
('version', '"1.0.0"', '系统版本'),
('default_water_freq', '7', '默认浇水频率（天）'),
('max_plants_per_user', '50', '每个用户最大植物数量'),
('weather_update_interval', '3600', '天气数据更新间隔（秒）'),
('reminder_advance_hours', '24', '提醒提前时间（小时）'),
('ai_conversation_limit', '100', 'AI对话记录保存数量限制')
ON CONFLICT (config_key) DO NOTHING;