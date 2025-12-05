# 文件名: tests/core/test_config.py
import pytest
# 导入您 app/core/config.py 中的 settings 实例
from app.core.config import settings

# CORE-C-001: 默认值加载
def test_core_c_001_project_name_default():
    """CORE-C-001: 验证项目名称默认值加载。"""
    # 预期结果: 断言 settings.PROJECT_NAME 是否等于 "植悟 ZhiWu"。
    assert settings.PROJECT_NAME == "植悟 ZhiWu"

# CORE-C-002: 常量验证
def test_core_c_002_api_v1_str_constant():
    """CORE-C-002: 验证 API 版本常量。"""
    # 预期结果: 断言 settings.API_V1_STR 是否等于 "/api/v1"。
    assert settings.API_V1_STR == "/api/v1"

# CORE-C-003: 关键配置存在性
def test_core_c_003_critical_configs_exist():
    """CORE-C-003: 验证 SECRET_KEY 和 DATABASE_URL 字段存在且不为空。"""
    # 确保字段存在且具有默认值
    assert settings.SECRET_KEY is not None
    assert settings.SECRET_KEY != ""
    assert settings.DATABASE_URL is not None
    assert settings.DATABASE_URL != ""

# CORE-C-004: Pydantic V2 配置 (验证 model_config 属性存在)
def test_core_c_004_pydantic_v2_config_model_config():
    """CORE-C-004: 验证 Pydantic V2 的 model_config 属性存在。"""
    # 预期结果: model_config 属性应该存在于 Settings 实例上。
    assert hasattr(settings, 'model_config')
    # 验证 model_config 中包含 env_file 配置
    assert 'env_file' in settings.model_config