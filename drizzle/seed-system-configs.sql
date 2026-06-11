-- 积分系统配置种子数据（value 为 jsonb 类型，数字直接写，字符串需双引号）
INSERT INTO system_configs (key, value, description, category, data_type, is_editable, is_secret)
VALUES
  ('points.dailyFreePoints', '1680', '每日免费积分', 'points', 'number', true, false),
  ('points.invitationReward', '2500', '邀请奖励积分（一次性）', 'points', 'number', true, false),
  ('points.liteMonthlyPoints', '100000', 'Lite 套餐每月积分', 'points', 'number', true, false),
  ('points.proMonthlyPoints', '300000', 'Pro 套餐每月积分', 'points', 'number', true, false),
  ('points.ttsCostChinese', '4', 'TTS 中文字符消耗', 'points', 'number', true, false),
  ('points.ttsCostEnglish', '2.5', 'TTS 英文字符消耗', 'points', 'number', true, false),
  ('points.ttsCostPunctuation', '0.5', 'TTS 标点消耗', 'points', 'number', true, false)
ON CONFLICT (key) DO NOTHING;

-- TTS 配置种子数据（jsonb 字符串值必须用双引号包裹）
INSERT INTO system_configs (key, value, description, category, data_type, is_editable, is_secret)
VALUES
  ('tts.apiKey', '""', 'MiniMax API Key（系统配置 → TTS 分类下设置）', 'tts', 'string', true, true),
  ('tts.apiEndpoint', '"https://api.minimaxi.com"', 'MiniMax API 地址', 'tts', 'string', true, false),
  ('tts.model', '"speech-2.8-hd"', 'MiniMax 模型名称', 'tts', 'string', true, false),
  ('tts.model.design', '"voice-design"', 'MiniMax 音色设计模型', 'tts', 'string', true, false),
  ('tts.model.clone', '"voice-clone"', 'MiniMax 声音复刻模型', 'tts', 'string', true, false),
  ('tts.defaultVoice', '"male-qn-qingse"', 'MiniMax 默认音色', 'tts', 'string', true, false),
  ('tts.languageBoost', '""', 'MiniMax 语言增强（留空=自动）', 'tts', 'string', true, false),
  ('tts.minimax.maxChars', '10000', 'MiniMax 单次最大字符数', 'tts', 'number', true, false),
  ('tts.mimo.apiKey', '""', 'MiMo API Key', 'tts', 'string', true, true),
  ('tts.mimo.endpoint', '"https://token-plan-cn.xiaomimimo.com/v1"', 'MiMo API 地址', 'tts', 'string', true, false),
  ('tts.mimo.model.preset', '"mimo-v2.5-tts"', 'MiMo 预置音色模型', 'tts', 'string', true, false),
  ('tts.mimo.model.design', '"mimo-v2.5-tts-voicedesign"', 'MiMo 音色设计模型', 'tts', 'string', true, false),
  ('tts.mimo.model.clone', '"mimo-v2.5-tts-voiceclone"', 'MiMo 声音复刻模型', 'tts', 'string', true, false),
  ('tts.mimo.defaultVoice', '"冰糖"', 'MiMo 默认音色', 'tts', 'string', true, false),
  ('tts.mimo.maxChars', '10000', 'MiMo 单次最大字符数', 'tts', 'number', true, false)
ON CONFLICT (key) DO NOTHING;
