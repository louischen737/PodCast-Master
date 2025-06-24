import os
from typing import Dict, Any
from dotenv import load_dotenv
from volcenginesdkarkruntime import Ark
import requests
from flask import Flask, jsonify

load_dotenv()

# 模拟LLM API调用
# 在实际应用中，您将在这里集成如OpenAI、Google Gemini等的SDK或API调用。

app = Flask(__name__)

@app.route('/api/available_voices', methods=['GET'])
def get_available_voices():
    try:
        # 替换为你的key
        api_url = "https://platform.minimaxi.com/document/get_voice?key=67ad69b6de78c19cae68b199"
        resp = requests.get(api_url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        # 假设返回格式为 {"success": true, "voices": [...]}
        voices = data.get("voices", [])
        return jsonify({"success": True, "voices": voices})
    except Exception as e:
        return jsonify({"success": False, "message": f'加载音色失败: {e}'}), 500

class PodcastGenerator:
    def __init__(self):
        self.api_key = os.getenv("ARK_API_KEY")  # 使用ARK_API_KEY作为Ark的api_key
        
        # 添加调试打印
        print(f"DEBUG (PodcastGenerator init): ARK_API_KEY: {'已设置' if self.api_key else '未设置'}")

        # 初始化Ark客户端
        self.ark_client = Ark(
            api_key=self.api_key,
            base_url="https://ark.cn-beijing.volces.com/api/v3"
        )
        
        # 自定义推理接入点ID，从控制台获取
        self.model = "ep-20250205180503-zhjq7"

    def _call_ark_api(self, system_prompt: str, user_prompt: str) -> str:
        """调用火山引擎Ark API"""
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # 使用Ark客户端的chat.completions.create方法
            completion = self.ark_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            # 打印调试信息
            print("DEBUG: Ark API Response:", completion)
            
            # 返回生成的内容
            result = completion.choices[0].message.content
            return result
                
        except Exception as e:
            print(f"ERROR: Ark API调用失败: {str(e)}")
            raise Exception(f"生成播客脚本失败: {str(e)}")

    def generate_podcast_script(
        self,
        content: dict,
        podcast_title: str = None,
        next_episode_preview: str = None,
        podcast_mode: str = 'single',  # 'single' 或 'double'
        script_length: str = 'medium',
        generate_show_notes: bool = False,
        role1_name: str = None, role1_style: str = None,
        roleA_name: str = None, roleA_style: str = None, roleA_duty: str = None,
        roleB_name: str = None, roleB_style: str = None, roleB_duty: str = None,
        podcast_host: str = None,
        language: str = 'zh'
    ) -> str:
        """
        根据模式和角色参数生成结构化播客脚本。
        """
        if not content or not content.get('content'):
            raise ValueError("传入的内容为空或无效，无法生成播客脚本。")
        
        content_text = self._format_content_for_llm(content, language)

        # 根据script_length设置不同的指令
        if language == 'zh':
            length_instructions = {
                'short': "请生成一个简洁的摘要式脚本，总字数控制在300-500字。只提取最核心的观点和要点，用简洁明了的语言表达，适合快速了解主题。",
                'medium': "请生成一个标准长度的脚本，总字数在800-1200字。内容要完整，包含主要观点、相关背景和基本分析，适合一般听众理解。",
                'long': "请生成一个内容详尽、深度分析的长篇脚本，总字数在2000-3000字。要求：1) 深入分析每个重要观点；2) 提供丰富的背景信息和上下文；3) 加入多个具体案例和例子；4) 进行多角度思考和讨论；5) 可以适当扩展和深化原材料，增加相关知识点；6) 包含总结和展望部分。"
            }
        else:
            length_instructions = {
                'short': "Please generate a concise, summary-style script, around 300-500 words total. Extract only the most essential points and key insights, using clear and straightforward language suitable for quick topic understanding.",
                'medium': "Please generate a standard-length script, around 800-1200 words total. Content should be comprehensive, including main points, relevant background, and basic analysis suitable for general audience understanding.",
                'long': "Please generate a detailed, in-depth, comprehensive script, around 2000-3000 words total. Requirements: 1) Deep analysis of each important point; 2) Provide rich background information and context; 3) Include multiple specific cases and examples; 4) Multi-perspective thinking and discussion; 5) Feel free to expand and deepen the source material, adding related knowledge points; 6) Include summary and outlook sections."
            }
        
        length_instruction = length_instructions.get(script_length, length_instructions['medium'])

        # 构造prompt
        if language == 'en':
            if podcast_mode == 'single':
                role = role1_name or ''
                style = role1_style or 'mild'
                extra_preview = ''
                if next_episode_preview:
                    extra_preview = f'. Please add a preview for the next episode: {next_episode_preview}'
                else:
                    extra_preview = '. If there is no next episode preview, do NOT generate any preview content.'
                intro_rule = ''
                if not role1_name:
                    intro_rule = "If no role name is provided, do NOT use any self-introduction like 'I am ...' or 'This is ...'. Start directly with a greeting or the main content."
                else:
                    intro_rule = f"Opening: Start with self-introduction like 'Hello everyone, I am {role}' or 'Welcome to {podcast_title or 'the podcast'}, I am {role}'. Only use the name '{role}' in the script."
                system_prompt = f"""You are a podcast script generation assistant. Based on the given content, generate a structured script suitable for a single-person podcast. {length_instruction} Output a JSON array, each item contains 'role' and 'text' fields. The role should be '{role}' (if provided), and text should only contain the spoken content, not the role name. Style: {style}. Podcast title: {podcast_title or ''}{extra_preview}.
{intro_rule}
All output must be in English. Translate any non-English content to English before generating the script.
Example: Hello everyone, welcome to {podcast_title or 'the podcast'}.
Note: The text field should only contain what the character says, no sound effects, background music, or action descriptions. Do not use any names other than '{role}'."""
            else:
                roleA = roleA_name or 'HostA'
                styleA = roleA_style or 'mild'
                dutyA = roleA_duty or ''
                roleB = roleB_name or 'HostB'
                styleB = roleB_style or 'mild'
                dutyB = roleB_duty or ''
                extra_preview = ''
                if next_episode_preview:
                    extra_preview = f'. Please add a preview for the next episode: {next_episode_preview}'
                else:
                    extra_preview = '. If there is no next episode preview, do NOT generate any preview content.'
                intro_rule = ''
                if not roleA_name and not roleB_name:
                    intro_rule = "If no role names are provided, do NOT use any self-introduction like 'I am ...'. Start directly with a natural dialogue or the main content. Default role names are 'HostA' and 'HostB'."
                else:
                    intro_rule = f"Opening: Both speakers introduce themselves, e.g., 'Hello everyone, I am {roleA}' and 'I am {roleB}' or 'Welcome to {podcast_title or 'this podcast'}, I am {roleA}/{roleB}'. Make sure to mention both names."
                system_prompt = f"""You are a podcast script generation assistant. Based on the given content, generate a structured script suitable for a two-person podcast. {length_instruction} Output a JSON array, each item contains 'role' and 'text' fields. The role should be '{roleA}' or '{roleB}' (if provided), and text should only contain the spoken content, not the role name. {roleA} style: {styleA}, {roleB} style: {styleB}.
{roleA}'s duty: {dutyA}
{roleB}'s duty: {dutyB}
Podcast title: {podcast_title or ''}{extra_preview}.
{intro_rule}
All output must be in English. Translate any non-English content to English before generating the script.
Note: The text field should only contain what the character says, no sound effects, background music, or action descriptions."""
            user_prompt = self._get_user_prompt_en(self._format_content_for_llm(content, language))
        else:
            if podcast_mode == 'single':
                role = role1_name or ''
                style = role1_style or '温和'
                extra_preview = ''
                if next_episode_preview:
                    extra_preview = f'结尾请加下期预告：{next_episode_preview}'
                else:
                    extra_preview = '如果没有下期预告，不要生成任何下期预告内容。'
                intro_rule = ''
                if not role1_name:
                    intro_rule = "如果没有指定角色名称，开头不要自我介绍，直接进入内容或用'大家好，欢迎收听本期播客'等自然表达，不要出现'我是主播'等字样。"
                else:
                    intro_rule = f"开场白要求：开头必须用'大家好，我是{role}'或'欢迎来到《{podcast_title or '播客节目'}》，我是{role}'等方式自我介绍，并在开场白和后续内容中只能出现'{role}'这个名字，不能出现其他任何人名。如果未指定主播名，则统一使用'主播'。"
                system_prompt = f"""你是一个播客脚本生成助手。请根据给定内容，生成适合单人播客的结构化脚本，{length_instruction}输出JSON数组，每项含 role 和 text 字段，role 为"{role}"（如有），text 只为台词内容，不包含角色名。风格偏{style}。播客名称：{podcast_title or ''}{extra_preview}。
{intro_rule}
示例：大家好，欢迎收听《{podcast_title or '播客节目'}》。
注意：text字段只包含角色说的话，不要包含任何音效描述、背景音、动作提示等内容。不得出现除'{role}'以外的名字。"""
            else:
                roleA = roleA_name or '角色A'
                styleA = roleA_style or '温和'
                dutyA = roleA_duty or ''
                roleB = roleB_name or '角色B'
                styleB = roleB_style or '温和'
                dutyB = roleB_duty or ''
                extra_preview = ''
                if next_episode_preview:
                    extra_preview = f'结尾请加下期预告：{next_episode_preview}'
                else:
                    extra_preview = '如果没有下期预告，不要生成任何下期预告内容。'
                intro_rule = ''
                if not roleA_name and not roleB_name:
                    intro_rule = "如果没有指定角色名称，开头不要用'我是角色A/B'，直接用自然的对话或主题切入，不要出现'角色A/B'等字样。默认角色名为'角色A'和'角色B'。"
                else:
                    intro_rule = f"开场白要求：两位对话者轮流用'大家好，我是{roleA}'和'我是{roleB}'或'欢迎来到《{podcast_title or '本期的播客'}》，我是{roleA}/{roleB}'等方式自我介绍，并在开场白中自然引出播客节目的名称（如果播客名称不为空），务必体现{roleA}和{roleB}的名字。"
                system_prompt = f"""你是一个播客脚本生成助手。请根据给定内容，生成适合双人播客的结构化脚本，{length_instruction}输出JSON数组，每项含 role 和 text 字段，role 为\"{roleA}\"或\"{roleB}\"（如有），text 只为台词内容，不包含角色名。{roleA}风格偏{styleA}，{roleB}风格偏{styleB}。
{roleA}的分工：{dutyA}
{roleB}的分工：{dutyB}
播客名称：{podcast_title or ''}{extra_preview}。
{intro_rule}
注意：text字段只包含角色说的话，不要包含任何音效描述、背景音、动作提示等内容。"""
            user_prompt = self._get_user_prompt(self._format_content_for_llm(content, language))
        
        # 生成播客脚本
        response_text = self._call_ark_api(system_prompt, user_prompt)
        
        return response_text.strip()

    def _format_content_for_llm(self, content: dict, language: str = 'zh') -> str:
        """将提取的内容格式化为适合LLM输入的文本。支持中英文结构。"""
        if language == 'en':
            title = content.get('title', 'Unknown Title')
            metadata = content.get('metadata', {})
            sections = content.get('content', [])
            key_points = content.get('key_points', [])
            cautions = content.get('cautions', '')

            formatted_text = f"# Title: {title}\n\n"

            if metadata:
                formatted_text += "## Metadata:\n"
                for key, value in metadata.items():
                    if value:
                        formatted_text += f"- {key.replace('_', ' ').title()}: {value}\n"
                formatted_text += "\n"

            if sections:
                formatted_text += "## Content:\n"
                for item in sections:
                    if item.get('section_title'):
                        formatted_text += f"### {item['section_title']}\n"
                    if item.get('text'):
                        formatted_text += f"{item['text']}\n"
                    if item.get('content_type') == 'list' and isinstance(item.get('items'), list):
                        for li in item['items']:
                            formatted_text += f"- {li}\n"
                    formatted_text += "\n"

            if key_points:
                formatted_text += "## Key Points:\n"
                for point in key_points:
                    formatted_text += f"- {point}\n"
                formatted_text += "\n"

            if cautions:
                formatted_text += f"## Cautions:\n{cautions}\n\n"

            return formatted_text
        else:
            title = content.get('title', '未知标题')
            metadata = content.get('metadata', {})
            sections = content.get('content', [])
            key_points = content.get('key_points', [])
            cautions = content.get('cautions', '')

            formatted_text = f"# 标题: {title}\n\n"

            if metadata:
                formatted_text += "## 元数据:\n"
                for key, value in metadata.items():
                    if value:
                        formatted_text += f"- {key.replace('_', ' ').title()}: {value}\n"
                formatted_text += "\n"

            if sections:
                formatted_text += "## 内容:\n"
                for item in sections:
                    if item.get('section_title'):
                        formatted_text += f"### {item['section_title']}\n"
                    if item.get('text'):
                        formatted_text += f"{item['text']}\n"
                    if item.get('content_type') == 'list' and isinstance(item.get('items'), list):
                        for li in item['items']:
                            formatted_text += f"- {li}\n"
                    formatted_text += "\n"

            if key_points:
                formatted_text += "## 关键点:\n"
                for point in key_points:
                    formatted_text += f"- {point}\n"
                formatted_text += "\n"

            if cautions:
                formatted_text += f"## 注意事项:\n{cautions}\n\n"

            return formatted_text

    def _get_user_prompt(self, content: str) -> str:
        """获取用户提示词"""
        return f"""请根据以下内容，为一期播客节目撰写一份详细的脚本。内容主题会从以下文本中提炼。请严格按照系统提示词的要求进行创作，特别是关于输出格式的严格要求，确保最终输出内容是纯粹的播客脚本，可以直接用于录制和语音合成。\n\n以下是需要你处理的核心内容：\n\n{content}\n\n请将生成的播客脚本直接输出，不要包含任何额外的引导语或说明。确保所有语音合成相关的标记都使用方括号格式，并保持标记的准确性和一致性。"""

    def _get_user_prompt_en(self, content: str) -> str:
        return f"""Based on the following content, write a detailed script for a podcast episode. The topic will be extracted from the text below. Strictly follow the system prompt requirements, especially the output format, and ensure the final output is a pure podcast script suitable for recording and TTS.

Here is the core content you need to process:

{content}

Please output the podcast script directly, without any extra instructions or explanations. Ensure all TTS-related tags use square brackets and keep the tags accurate and consistent."""

    def _simulate_llm_response(self, content_text: str, title: str = "") -> str:
        """
        模拟LLM的响应，实际应替换为真实的LLM API调用。
        """
        simulated_script = (
            f"嘿，大家好！欢迎收听今天的播客节目。"\
            f"今天我们要聊的话题是：{title if title else '一个非常有趣的主题'}。"\
            f"我们从一份资料里看到了一些很有意思的内容，现在就用大白话给大家讲讲。\n\n"\
            f"根据这份资料，我总结了一下主要内容。大家可以把这份文本想象成一份详细的笔记，而我现在正把这份笔记变成一段轻松的聊天。\n\n"\
            f"(以下内容为LLM对原文的口语化改写，请在这里集成您的LLM API调用，并将`content_text`作为输入。)\n\n"\
            f"比如，里面提到了\"" + content_text[:150] + "...\" 这段话，如果用播客的形式来表达，"\
            f"我们大概会这样说：\"好的，大家可能听过某个概念，但具体是什么意思呢？简单来说就是...\"\n\n"\
            f"总之，这份内容非常丰富，今天就先聊到这里，希望大家有所收获！下期再见！"
        )
        return simulated_script 

    def _generate_show_notes(self, content: str, podcast_title: str, language: str = 'zh') -> str:
        """生成播客的show notes"""
        if language == 'zh':
            system_prompt = f"""你是一个播客show notes生成助手。请根据播客内容，生成一份专业的show notes（节目说明）。

请按照以下格式生成：

# 节目标题
{podcast_title or '播客节目'}

# 节目简介
[用2-3句话简要介绍本期节目的主要内容]

# 关键要点
- [要点1]
- [要点2]
- [要点3]
- [要点4]

# 时间轴
00:00 - 开场介绍
[根据内容生成时间轴，标注重要话题的时间点]

# 相关资源
[如果有相关链接、书籍、文章等，请列出]

# 下期预告
[简要预告下期内容]

注意：
1. 时间轴要根据脚本内容合理分配时间
2. 关键要点要突出核心观点
3. 语言要简洁明了，便于听众快速了解节目内容
4. 如果有专业术语，请适当解释"""
        else:
            system_prompt = f"""You are a podcast show notes generation assistant. Please generate professional show notes based on the podcast content.

Please generate in the following format:

# Episode Title
{podcast_title or 'Podcast Episode'}

# Episode Summary
[Briefly introduce the main content of this episode in 2-3 sentences]

# Key Points
- [Point 1]
- [Point 2]
- [Point 3]
- [Point 4]

# Timeline
00:00 - Introduction
[Generate timeline based on content, marking important topic timestamps]

# Related Resources
[List related links, books, articles, etc. if any]

# Next Episode Preview
[Brief preview of next episode content]

Notes:
1. Timeline should reasonably allocate time based on script content
2. Key points should highlight core viewpoints
3. Language should be concise and clear for listeners to quickly understand
4. If there are technical terms, please explain appropriately"""

        user_prompt = f"""请根据以下播客内容生成show notes：

{content}

请确保show notes与播客脚本内容保持一致，并突出重要信息。"""
        
        try:
            show_notes = self._call_ark_api(system_prompt, user_prompt)
            return show_notes.strip()
        except Exception as e:
            print(f"生成show notes失败: {str(e)}")
            return "Show Notes生成失败，请稍后重试。" 