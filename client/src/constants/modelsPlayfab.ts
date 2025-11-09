// Authored by: Cascade using Claude 3.5 Sonnet
// Date: 2025-11-09T05:15:41.646Z
// Purpose: Source of truth for AI model to PlayFab ID mappings
// How it works: Maps arc-explainer model keys to their corresponding PlayFab player IDs
// Project usage: Used by client-side code to reference AI players and for duplicate detection during registration

export interface AIModelMapping {
  key: string;
  name: string;
  provider: string;
  playFabId: string;
  customId: string;
  registrationDate: string;
}

export const AI_MODEL_PLAYFAB_MAPPINGS: Record<string, AIModelMapping> = {
  'gpt-4.1-nano-2025-04-14': {
    key: 'gpt-4.1-nano-2025-04-14',
    name: 'GPT-4.1 Nano',
    provider: 'OpenAI',
    playFabId: '2944C7385E107278',
    customId: 'AI_OPENAI_GPT_4_1_NANO_2025_04_14',
    registrationDate: '2025-09-15T18:34:24.734Z'
  },
  'gpt-4.1-mini-2025-04-14': {
    key: 'gpt-4.1-mini-2025-04-14',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    playFabId: 'BC1BB5987F7FDBA9',
    customId: 'AI_OPENAI_GPT_4_1_MINI_2025_04_14',
    registrationDate: '2025-09-15T18:34:50.693Z'
  },
  'gpt-4o-mini-2024-07-18': {
    key: 'gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    playFabId: '4456156A86933343',
    customId: 'AI_OPENAI_GPT_4O_MINI_2024_07_18',
    registrationDate: '2025-09-15T18:35:16.662Z'
  },
  'o3-mini-2025-01-31': {
    key: 'o3-mini-2025-01-31',
    name: 'o3-mini',
    provider: 'OpenAI',
    playFabId: 'F1C550D2B62B8DD4',
    customId: 'AI_OPENAI_O3_MINI_2025_01_31',
    registrationDate: '2025-09-15T18:35:42.748Z'
  },
  'o4-mini-2025-04-16': {
    key: 'o4-mini-2025-04-16',
    name: 'o4-mini',
    provider: 'OpenAI',
    playFabId: '13C1AE6A47F0A1AC',
    customId: 'AI_OPENAI_O4_MINI_2025_04_16',
    registrationDate: '2025-09-15T18:36:08.749Z'
  },
  'o3-2025-04-16': {
    key: 'o3-2025-04-16',
    name: 'o3-2025-04-16',
    provider: 'OpenAI',
    playFabId: '3149368ECA1B39DC',
    customId: 'AI_OPENAI_O3_2025_04_16',
    registrationDate: '2025-09-15T18:36:34.705Z'
  },
  'gpt-4.1-2025-04-14': {
    key: 'gpt-4.1-2025-04-14',
    name: 'GPT-4.1',
    provider: 'OpenAI',
    playFabId: '283650B56BE62A8C',
    customId: 'AI_OPENAI_GPT_4_1_2025_04_14',
    registrationDate: '2025-09-15T18:37:00.723Z'
  },
  'gpt-5-2025-08-07': {
    key: 'gpt-5-2025-08-07',
    name: 'GPT-5',
    provider: 'OpenAI',
    playFabId: 'BC1E07DDB59EB2E5',
    customId: 'AI_OPENAI_GPT_5_2025_08_07',
    registrationDate: '2025-09-15T18:37:26.715Z'
  },
  'gpt-5-chat-latest': {
    key: 'gpt-5-chat-latest',
    name: 'GPT-5 Chat',
    provider: 'OpenAI',
    playFabId: 'E4AC4FB9F08CE3D7',
    customId: 'AI_OPENAI_GPT_5_CHAT_LATEST',
    registrationDate: '2025-09-15T18:37:52.658Z'
  },
  'gpt-5-mini-2025-08-07': {
    key: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    playFabId: '5F233EBA4360B3A7',
    customId: 'AI_OPENAI_GPT_5_MINI_2025_08_07',
    registrationDate: '2025-09-15T18:38:18.675Z'
  },
  'gpt-5-nano-2025-08-07': {
    key: 'gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano',
    provider: 'OpenAI',
    playFabId: '5498BBA2D5D765F2',
    customId: 'AI_OPENAI_GPT_5_NANO_2025_08_07',
    registrationDate: '2025-09-15T18:38:44.656Z'
  },
  'claude-sonnet-4-20250514': {
    key: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    playFabId: '8D4113D5639B9912',
    customId: 'AI_ANTHROPIC_CLAUDE_SONNET_4_20250514',
    registrationDate: '2025-09-15T18:39:10.628Z'
  },
  'claude-3-7-sonnet-20250219': {
    key: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    playFabId: '71A5C379C76A6FF1',
    customId: 'AI_ANTHROPIC_CLAUDE_3_7_SONNET_20250219',
    registrationDate: '2025-09-15T18:39:36.680Z'
  },
  'claude-3-5-sonnet-20241022': {
    key: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    playFabId: '39E9CD78BFA44C1C',
    customId: 'AI_ANTHROPIC_CLAUDE_3_5_SONNET_20241022',
    registrationDate: '2025-09-15T18:40:02.678Z'
  },
  'claude-3-5-haiku-20241022': {
    key: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    playFabId: 'EFE6B7E628B08D24',
    customId: 'AI_ANTHROPIC_CLAUDE_3_5_HAIKU_20241022',
    registrationDate: '2025-09-15T18:40:28.601Z'
  },
  'claude-3-haiku-20240307': {
    key: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    playFabId: 'FCA7888A8CADA4C3',
    customId: 'AI_ANTHROPIC_CLAUDE_3_HAIKU_20240307',
    registrationDate: '2025-09-15T18:40:54.615Z'
  },
  'gemini-2.5-pro': {
    key: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Gemini',
    playFabId: '66A244AD329F5B4F',
    customId: 'AI_GEMINI_GEMINI_2_5_PRO',
    registrationDate: '2025-09-15T18:41:20.608Z'
  },
  'gemini-2.5-flash': {
    key: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Gemini',
    playFabId: 'C6884F905272D972',
    customId: 'AI_GEMINI_GEMINI_2_5_FLASH',
    registrationDate: '2025-09-15T18:41:46.540Z'
  },
  'gemini-2.5-flash-lite': {
    key: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'Gemini',
    playFabId: 'D5B3E864879ACE9D',
    customId: 'AI_GEMINI_GEMINI_2_5_FLASH_LITE',
    registrationDate: '2025-09-15T18:42:12.544Z'
  },
  'gemini-2.0-flash': {
    key: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Gemini',
    playFabId: 'EDD402D75520823',
    customId: 'AI_GEMINI_GEMINI_2_0_FLASH',
    registrationDate: '2025-09-15T18:42:38.667Z'
  },
  'gemini-2.0-flash-lite': {
    key: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: 'Gemini',
    playFabId: '22B208EBE38720AD',
    customId: 'AI_GEMINI_GEMINI_2_0_FLASH_LITE',
    registrationDate: '2025-09-15T18:43:04.686Z'
  },
  'deepseek-chat': {
    key: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    playFabId: 'D45EE9CB4608B7AF',
    customId: 'AI_DEEPSEEK_DEEPSEEK_CHAT',
    registrationDate: '2025-09-15T18:43:30.767Z'
  },
  'deepseek-reasoner': {
    key: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    provider: 'DeepSeek',
    playFabId: '328E40078396739E',
    customId: 'AI_DEEPSEEK_DEEPSEEK_REASONER',
    registrationDate: '2025-09-15T18:43:56.733Z'
  },
  'meta-llama/llama-3.3-70b-instruct': {
    key: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'OpenRouter',
    playFabId: '9A7EE7F2372EFDD7',
    customId: 'AI_OPENROUTER_META_LLAMA_LLAMA_3_3_70B_INSTRUCT',
    registrationDate: '2025-09-15T18:44:22.894Z'
  },
  'qwen/qwen-2.5-coder-32b-instruct': {
    key: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'OpenRouter',
    playFabId: '5181D3A214B5190E',
    customId: 'AI_OPENROUTER_QWEN_QWEN_2_5_CODER_32B_INSTRUCT',
    registrationDate: '2025-09-15T18:44:48.949Z'
  },
  'cohere/command-r-plus': {
    key: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'OpenRouter',
    playFabId: 'B1A56D4200893C50',
    customId: 'AI_OPENROUTER_COHERE_COMMAND_R_PLUS',
    registrationDate: '2025-09-15T18:45:14.932Z'
  },
  'baidu/ernie-4.5-vl-28b-a3b': {
    key: 'baidu/ernie-4.5-vl-28b-a3b',
    name: 'Ernie 4.5 VL 28B',
    provider: 'OpenRouter',
    playFabId: '469859E28846CEFF',
    customId: 'AI_OPENROUTER_BAIDU_ERNIE_4_5_VL_28B_A3B',
    registrationDate: '2025-09-15T18:45:40.842Z'
  },
  'nousresearch/hermes-4-70b': {
    key: 'nousresearch/hermes-4-70b',
    name: 'NousResearch Hermes 4 70B',
    provider: 'OpenRouter',
    playFabId: '113A939C0E6FD16A',
    customId: 'AI_OPENROUTER_NOUSRESEARCH_HERMES_4_70B',
    registrationDate: '2025-09-15T18:46:07.456Z'
  },
  'mistralai/mistral-large': {
    key: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'OpenRouter',
    playFabId: 'A969FF1FCDF933E6',
    customId: 'AI_OPENROUTER_MISTRALAI_MISTRAL_LARGE',
    registrationDate: '2025-09-15T18:46:33.433Z'
  },
  'deepseek/deepseek-chat-v3.1': {
    key: 'deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek Chat v3.1',
    provider: 'OpenRouter',
    playFabId: '51FD4BCC82765513',
    customId: 'AI_OPENROUTER_DEEPSEEK_DEEPSEEK_CHAT_V3_1',
    registrationDate: '2025-09-15T18:46:59.580Z'
  },
  'x-ai/grok-code-fast-1': {
    key: 'x-ai/grok-code-fast-1',
    name: 'xAI Grok Code Fast 1',
    provider: 'OpenRouter',
    playFabId: '7D971A64F41DD2D4',
    customId: 'AI_OPENROUTER_X_AI_GROK_CODE_FAST_1',
    registrationDate: '2025-09-15T18:47:25.631Z'
  },
  'openai/gpt-oss-120b': {
    key: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B',
    provider: 'OpenRouter',
    playFabId: 'A84BE57256B7EA2',
    customId: 'AI_OPENROUTER_OPENAI_GPT_OSS_120B',
    registrationDate: '2025-09-15T18:47:51.945Z'
  },
  'mistralai/codestral-2508': {
    key: 'mistralai/codestral-2508',
    name: 'Mistral Codestral 2508',
    provider: 'OpenRouter',
    playFabId: 'E80081A0A1F4289F',
    customId: 'AI_OPENROUTER_MISTRALAI_CODESTRAL_2508',
    registrationDate: '2025-09-15T18:48:18.143Z'
  },
  'qwen/qwen3-30b-a3b-instruct-2507': {
    key: 'qwen/qwen3-30b-a3b-instruct-2507',
    name: 'Qwen3 30B A3B Instruct',
    provider: 'OpenRouter',
    playFabId: '657F57EF1CEF57CC',
    customId: 'AI_OPENROUTER_QWEN_QWEN3_30B_A3B_INSTRUCT_2507',
    registrationDate: '2025-09-15T18:48:44.383Z'
  },
  'z-ai/glm-4.5-air:free': {
    key: 'z-ai/glm-4.5-air:free',
    name: 'Z-AI GLM 4.5 (Air)',
    provider: 'OpenRouter',
    playFabId: 'FF79ACD7D4807445',
    customId: 'AI_OPENROUTER_Z_AI_GLM_4_5_AIR_FREE',
    registrationDate: '2025-09-15T18:49:10.391Z'
  },
  'qwen/qwen3-235b-a22b-thinking-2507': {
    key: 'qwen/qwen3-235b-a22b-thinking-2507',
    name: 'Qwen3 235B A22B Thinking',
    provider: 'OpenRouter',
    playFabId: '690978410584D14A',
    customId: 'AI_OPENROUTER_QWEN_QWEN3_235B_A22B_THINKING_2507',
    registrationDate: '2025-09-15T18:49:36.596Z'
  },
  'qwen/qwen3-coder': {
    key: 'qwen/qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'OpenRouter',
    playFabId: '687C88BFEE733BA2',
    customId: 'AI_OPENROUTER_QWEN_QWEN3_CODER',
    registrationDate: '2025-09-15T18:50:02.665Z'
  },
  'moonshotai/kimi-k2': {
    key: 'moonshotai/kimi-k2',
    name: 'Moonshot Kimi K2',
    provider: 'OpenRouter',
    playFabId: '58410B2EF35C71A1',
    customId: 'AI_OPENROUTER_MOONSHOTAI_KIMI_K2',
    registrationDate: '2025-09-15T18:50:28.666Z'
  },
  'moonshotai/kimi-k2-0905': {
    key: 'moonshotai/kimi-k2-0905',
    name: 'Moonshot Kimi K2 (Sep 2025)',
    provider: 'OpenRouter',
    playFabId: '54160D63527F9986',
    customId: 'AI_OPENROUTER_MOONSHOTAI_KIMI_K2_0905',
    registrationDate: '2025-09-15T18:50:54.878Z'
  },
  'moonshotai/kimi-dev-72b:free': {
    key: 'moonshotai/kimi-dev-72b:free',
    name: 'Kimi Dev 72B (Free)',
    provider: 'OpenRouter',
    playFabId: 'E47B2420CFB1849F',
    customId: 'AI_OPENROUTER_MOONSHOTAI_KIMI_DEV_72B_FREE',
    registrationDate: '2025-09-15T18:51:20.921Z'
  },
  'x-ai/grok-4': {
    key: 'x-ai/grok-4',
    name: 'Grok 4 (July 2025)',
    provider: 'OpenRouter',
    playFabId: '4206052B479C8613',
    customId: 'AI_OPENROUTER_X_AI_GROK_4',
    registrationDate: '2025-09-15T18:51:46.893Z'
  },
  'x-ai/grok-3': {
    key: 'x-ai/grok-3',
    name: 'Grok 3',
    provider: 'OpenRouter',
    playFabId: '72159CC704348B7D',
    customId: 'AI_OPENROUTER_X_AI_GROK_3',
    registrationDate: '2025-09-15T18:52:13.011Z'
  },
  'x-ai/grok-3-mini': {
    key: 'x-ai/grok-3-mini',
    name: 'Grok 3 Mini',
    provider: 'OpenRouter',
    playFabId: 'B23CA191D3009BE1',
    customId: 'AI_OPENROUTER_X_AI_GROK_3_MINI',
    registrationDate: '2025-09-15T18:52:39.055Z'
  },
  'cohere/command-a': {
    key: 'cohere/command-a',
    name: 'Cohere Command A',
    provider: 'OpenRouter',
    playFabId: 'B63777F6B307C021',
    customId: 'AI_OPENROUTER_COHERE_COMMAND_A',
    registrationDate: '2025-09-15T18:53:05.038Z'
  },
  'deepseek/deepseek-prover-v2': {
    key: 'deepseek/deepseek-prover-v2',
    name: 'DeepSeek Prover v2',
    provider: 'OpenRouter',
    playFabId: 'BE60FB86B490E3F9',
    customId: 'AI_OPENROUTER_DEEPSEEK_DEEPSEEK_PROVER_V2',
    registrationDate: '2025-09-15T18:53:30.970Z'
  },
  'deepseek/deepseek-r1-0528:free': {
    key: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 0528 (Free)',
    provider: 'OpenRouter',
    playFabId: 'D7B928541B4CB20',
    customId: 'AI_OPENROUTER_DEEPSEEK_DEEPSEEK_R1_0528_FREE',
    registrationDate: '2025-09-15T18:53:57.230Z'
  },
  'nvidia/nemotron-nano-9b-v2': {
    key: 'nvidia/nemotron-nano-9b-v2',
    name: 'Nemotron Nano 9B V2',
    provider: 'OpenRouter',
    playFabId: '3843DB23755CF16D',
    customId: 'AI_OPENROUTER_NVIDIA_NEMOTRON_NANO_9B_V2',
    registrationDate: '2025-09-15T18:54:23.215Z'
  },
  'qwen/qwen3-max': {
    key: 'qwen/qwen3-max',
    name: 'Qwen3 Max',
    provider: 'OpenRouter',
    playFabId: 'C919A1B4852957BA',
    customId: 'AI_OPENROUTER_QWEN_QWEN3_MAX',
    registrationDate: '2025-09-15T18:54:49.144Z'
  },
  'openrouter/sonoma-sky-alpha': {
    key: 'openrouter/sonoma-sky-alpha',
    name: 'Sonoma Sky Alpha',
    provider: 'OpenRouter',
    playFabId: '9A696FD676F51DCC',
    customId: 'AI_OPENROUTER_OPENROUTER_SONOMA_SKY_ALPHA',
    registrationDate: '2025-09-15T18:55:15.150Z'
  },
  'bytedance/seed-oss-36b-instruct': {
    key: 'bytedance/seed-oss-36b-instruct',
    name: 'Seed OSS 36B Instruct',
    provider: 'OpenRouter',
    playFabId: '70B942EB59850E99',
    customId: 'AI_OPENROUTER_BYTEDANCE_SEED_OSS_36B_INSTRUCT',
    registrationDate: '2025-09-15T18:55:41.113Z'
  },
  'stepfun-ai/step3': {
    key: 'stepfun-ai/step3',
    name: 'Step3',
    provider: 'OpenRouter',
    playFabId: '6FB06EE024D952E9',
    customId: 'AI_OPENROUTER_STEPFUN_AI_STEP3',
    registrationDate: '2025-09-15T18:56:07.217Z'
  },
  'qwen/qwen-plus-2025-07-28:thinking': {
    key: 'qwen/qwen-plus-2025-07-28:thinking',
    name: 'Qwen: Qwen Plus 0728 (thinking)',
    provider: 'OpenRouter',
    playFabId: '4212DFF7625B7142',
    customId: 'AI_OPENROUTER_QWEN_QWEN_PLUS_2025_07_28_THINKING',
    registrationDate: '2025-09-18T05:13:17.715Z'
  },
  'z-ai/glm-4.5': {
    key: 'z-ai/glm-4.5',
    name: 'Z-AI GLM 4.5',
    provider: 'OpenRouter',
    playFabId: '1035483D7EC687C5',
    customId: 'AI_OPENROUTER_Z_AI_GLM_4_5',
    registrationDate: '2025-09-18T05:13:44.634Z'
  },
  'x-ai/grok-4-fast:free': {
    key: 'x-ai/grok-4-fast:free',
    name: 'Grok 4 Fast',
    provider: 'OpenRouter',
    playFabId: 'E40EF54572B3B49F',
    customId: 'AI_OPENROUTER_X_AI_GROK_4_FAST_FREE',
    registrationDate: '2025-09-21T02:38:52.568Z'
  },
  'qwen/qwen3-30b-a3b-instruct': {
    key: 'qwen/qwen3-30b-a3b-instruct',
    name: 'Qwen3 30B A3B Instruct',
    provider: 'OpenRouter',
    playFabId: 'C75EA5215DB6D93B',
    customId: 'AI_OPENROUTER_QWEN_QWEN3_30B_A3B_INSTRUCT',
    registrationDate: '2025-09-25T17:12:26.086Z'
  },
  'qwen/qwen3-235b-a22b-thinking': {
    key: 'qwen/qwen3-235b-a22b-thinking',
    name: 'Qwen3 235B A22B Thinking',
    provider: 'OpenRouter',
    playFabId: '44AA316466E6EB85',
    customId: 'AI_OPENROUTER_QWEN_QWEN3_235B_A22B_THINKING',
    registrationDate: '2025-09-25T17:12:52.576Z'
  },
  'claude-sonnet-4-5-20250929': {
    key: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    playFabId: '347809AB010DD54D',
    customId: 'AI_ANTHROPIC_CLAUDE_SONNET_4_5_20250929',
    registrationDate: '2025-11-09T05:08:15.380Z'
  },
  'claude-haiku-4-5-20251015': {
    key: 'claude-haiku-4-5-20251015',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    playFabId: '9A1994C5D3909570',
    customId: 'AI_ANTHROPIC_CLAUDE_HAIKU_4_5_20251015',
    registrationDate: '2025-11-09T05:08:41.376Z'
  },
  'deepseek/deepseek-v3.1-terminus': {
    key: 'deepseek/deepseek-v3.1-terminus',
    name: 'DeepSeek V3.1 Terminus',
    provider: 'OpenRouter',
    playFabId: 'E8CE0D22DFFD251B',
    customId: 'AI_OPENROUTER_DEEPSEEK_DEEPSEEK_V3_1_TERMINUS',
    registrationDate: '2025-11-09T05:09:08.033Z'
  },
  'moonshotai/kimi-k2-thinking': {
    key: 'moonshotai/kimi-k2-thinking',
    name: 'Moonshot Kimi K2 Thinking',
    provider: 'OpenRouter',
    playFabId: '320757F9F7F33305',
    customId: 'AI_OPENROUTER_MOONSHOTAI_KIMI_K2_THINKING',
    registrationDate: '2025-11-09T05:09:34.284Z'
  },
  'openrouter/polaris-alpha': {
    key: 'openrouter/polaris-alpha',
    name: 'OpenRouter Polaris (Temporary Alias)',
    provider: 'OpenRouter',
    playFabId: '51CB2BE0C582BABD',
    customId: 'AI_OPENROUTER_OPENROUTER_POLARIS_ALPHA',
    registrationDate: '2025-11-09T05:10:00.953Z'
  },
  'grok-4': {
    key: 'grok-4',
    name: 'Grok 4',
    provider: 'xAI',
    playFabId: 'B4200E2A5600B916',
    customId: 'AI_XAI_GROK_4',
    registrationDate: '2025-11-09T05:10:26.987Z'
  },
  'grok-4-fast-reasoning': {
    key: 'grok-4-fast-reasoning',
    name: 'Grok 4 Fast Reasoning',
    provider: 'xAI',
    playFabId: '25E1AC442A1E6A36',
    customId: 'AI_XAI_GROK_4_FAST_REASONING',
    registrationDate: '2025-11-09T05:10:53.109Z'
  },
  'grok-4-fast-non-reasoning': {
    key: 'grok-4-fast-non-reasoning',
    name: 'Grok 4 Fast Non-Reasoning',
    provider: 'xAI',
    playFabId: '10F25EC2CEAEE1E8',
    customId: 'AI_XAI_GROK_4_FAST_NON_REASONING',
    registrationDate: '2025-11-09T05:11:19.255Z'
  },
  'x-ai/grok-3-mini-fast': {
    key: 'x-ai/grok-3-mini-fast',
    name: 'Grok 3 Mini Fast',
    provider: 'OpenRouter',
    playFabId: '136784E2053DC53',
    customId: 'AI_OPENROUTER_X_AI_GROK_3_MINI_FAST',
    registrationDate: '2025-11-09T05:11:45.198Z'
  },
  'anthropic/claude-haiku-4.5': {
    key: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5 (OpenRouter)',
    provider: 'OpenRouter',
    playFabId: 'E074BA28DAA76C1F',
    customId: 'AI_OPENROUTER_ANTHROPIC_CLAUDE_HAIKU_4_5',
    registrationDate: '2025-11-09T05:12:11.464Z'
  },
  'nvidia/nemotron-nano-12b-v2-vl:free': {
    key: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B V2 VL (Free)',
    provider: 'OpenRouter',
    playFabId: '185B214C33949FAB',
    customId: 'AI_OPENROUTER_NVIDIA_NEMOTRON_NANO_12B_V2_VL_FREE',
    registrationDate: '2025-11-09T05:12:37.622Z'
  },
  'amazon/nova-premier-v1': {
    key: 'amazon/nova-premier-v1',
    name: 'Amazon Nova Premier 1.0',
    provider: 'OpenRouter',
    playFabId: '47A0AA64B7F88022',
    customId: 'AI_OPENROUTER_AMAZON_NOVA_PREMIER_V1',
    registrationDate: '2025-11-09T05:13:04.290Z'
  },
  'minimax/minimax-m2': {
    key: 'minimax/minimax-m2',
    name: 'MiniMax M2',
    provider: 'OpenRouter',
    playFabId: '995454B27941EBEF',
    customId: 'AI_OPENROUTER_MINIMAX_MINIMAX_M2',
    registrationDate: '2025-11-09T05:13:30.283Z'
  },
  'google/gemini-2.5-flash-preview-09-2025': {
    key: 'google/gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash Preview (Sep 2025)',
    provider: 'OpenRouter',
    playFabId: '8FA5F477574AF146',
    customId: 'AI_OPENROUTER_GOOGLE_GEMINI_2_5_FLASH_PREVIEW_09_2025',
    registrationDate: '2025-11-09T05:13:56.435Z'
  },
  'z-ai/glm-4.6': {
    key: 'z-ai/glm-4.6',
    name: 'GLM 4.6',
    provider: 'OpenRouter',
    playFabId: '68FCABDB7ECEB20E',
    customId: 'AI_OPENROUTER_Z_AI_GLM_4_6',
    registrationDate: '2025-11-09T05:14:22.895Z'
  },
  'grover-grok-4-fast-reasoning': {
    key: 'grover-grok-4-fast-reasoning',
    name: 'Grover (Grok 4 Fast Reasoning)',
    provider: 'Grover',
    playFabId: '5AEDDF90B3DA07E2',
    customId: 'AI_GROVER_GROVER_GROK_4_FAST_REASONING',
    registrationDate: '2025-11-09T05:14:49.172Z'
  },
  'grover-gpt-5-nano': {
    key: 'grover-gpt-5-nano',
    name: 'Grover (GPT-5 Nano)',
    provider: 'Grover',
    playFabId: 'BDBC98123FFB9201',
    customId: 'AI_GROVER_GROVER_GPT_5_NANO',
    registrationDate: '2025-11-09T05:15:15.139Z'
  },
  'grover-gpt-5-mini': {
    key: 'grover-gpt-5-mini',
    name: 'Grover (GPT-5 Mini)',
    provider: 'Grover',
    playFabId: '5CEDC4F59EC636BF',
    customId: 'AI_GROVER_GROVER_GPT_5_MINI',
    registrationDate: '2025-11-09T05:15:41.646Z'
  }
};

// Helper functions for working with mappings
export const getPlayFabIdByModelKey = (modelKey: string): string | undefined => {
  return AI_MODEL_PLAYFAB_MAPPINGS[modelKey]?.playFabId;
};

export const isModelRegistered = (modelKey: string): boolean => {
  return modelKey in AI_MODEL_PLAYFAB_MAPPINGS;
};

export const getAllRegisteredModels = (): AIModelMapping[] => {
  return Object.values(AI_MODEL_PLAYFAB_MAPPINGS);
};

export const getRegisteredModelCount = (): number => {
  return Object.keys(AI_MODEL_PLAYFAB_MAPPINGS).length;
};
