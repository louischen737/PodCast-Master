from fastapi import APIRouter, UploadFile, File, Form, Request, Body
from fastapi.responses import JSONResponse, StreamingResponse
import os
import json
import requests
from werkzeug.utils import secure_filename
import shutil
from content_extractor.extractor import ContentExtractor
from ai_parser.podcast_generator import PodcastGenerator
from typing import Union
import traceback
from webapp.minimax_tts import get_tts_client
import re
from pydub import AudioSegment
import io

router = APIRouter()

# 获取当前文件所在目录的绝对路径
current_dir = os.path.dirname(os.path.abspath(__file__))

# 配置上传目录
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

extractor = ContentExtractor()
generator = PodcastGenerator()

@router.post('/api/extract_file')
async def extract_file(file: Union[UploadFile, object] = File(...)):
    """
    兼容 FastAPI 和 Starlette 的 UploadFile 类型
    """
    try:
        # 兼容 starlette.datastructures.UploadFile
        filename = getattr(file, 'filename', None)
        fileobj = getattr(file, 'file', None)
        if not filename or not fileobj:
            return JSONResponse(status_code=400, content={"error": "无效的文件对象"})
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as buffer:
            shutil.copyfileobj(fileobj, buffer)
        # 使用ContentExtractor提取内容
        result = extractor.process_file(filepath)
        os.remove(filepath)
        return {"success": True, "content": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post('/api/extract_url')
async def extract_url(url: str = Form(...)):
    try:
        result = extractor.process_url(url)
        return {"success": True, "content": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post('/api/extract')
async def extract(request: Request):
    form = await request.form()
    if 'file' in form:
        file = form['file']
        # 直接传递 file
        return await extract_file(file)
    elif 'url' in form:
        url = form['url']
        return await extract_url(url)
    else:
        return JSONResponse(status_code=400, content={"error": "未提供文件或URL"})

@router.get('/api/available_voices')
async def get_available_voices():
    try:
        tts = get_tts_client()
        voices_raw = tts.get_available_voices()  # 原始格式: [{"voice_id":..., "voice_name":...}, ...]
        
        # 将后端格式转换为前端需要的格式
        voices_formatted = [
            {"value": v.get("voice_id"), "label": v.get("voice_name")}
            for v in voices_raw
            if v.get("voice_id") and v.get("voice_name")
        ]
        
        return {"success": True, "voices": voices_formatted}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@router.post('/api/generate_audio')
async def generate_audio(
    text: str = Form(...),
    mode: str = Form('single'),
    roleAName: str = Form(None),
    roleBName: str = Form(None),
    roleAVoice: str = Form(None),
    roleBVoice: str = Form(None),
    voice: str = Form(None),
    speedA: float = Form(1.0),
    volumeA: float = Form(1.0),
    pitchA: float = Form(1.0),
    emotionA: str = Form('neutral'),
    speedB: float = Form(1.0),
    volumeB: float = Form(1.0),
    pitchB: float = Form(1.0),
    emotionB: str = Form('neutral'),
    speed: float = Form(1.0),
    volume: float = Form(1.0),
    pitch: float = Form(1.0),
    emotion: str = Form('neutral'),
    language: str = Form('zh')
):
    """
    支持双人模式结构化脚本顺序合成和拼接音频。
    前端 text 字段可为结构化 JSON（推荐），也可为纯文本。
    """
    tts = get_tts_client()
    combined_audio = AudioSegment.empty()

    try:
        if mode == 'double':
            # 优先尝试解析结构化 JSON
            try:
                script_json = json.loads(text)
                assert isinstance(script_json, list)
            except Exception:
                # 回退为按行分割的纯文本
                lines = text.split('\n')
                script_json = []
                for line in lines:
                    if roleAName and line.startswith(roleAName):
                        script_json.append({'role': roleAName, 'text': line[len(roleAName):].strip()})
                    elif roleBName and line.startswith(roleBName):
                        script_json.append({'role': roleBName, 'text': line[len(roleBName):].strip()})
            
            for item in script_json:
                role = item.get('role')
                txt = item.get('text', '').strip()
                if not txt:
                    continue
                
                audio_piece = None
                if role == roleAName:
                    audio_piece = tts.synthesize_long_text(
                        txt, roleAVoice,
                        speed=speedA, volume=int(volumeA), pitch=int(pitchA), emotion=emotionA, language=language
                    )
                elif role == roleBName:
                    audio_piece = tts.synthesize_long_text(
                        txt, roleBVoice,
                        speed=speedB, volume=int(volumeB), pitch=int(pitchB), emotion=emotionB, language=language
                    )
                
                if audio_piece:
                    segment = AudioSegment.from_file(io.BytesIO(audio_piece), format="mp3")
                    combined_audio += segment

        else:
            # 单人模式，逐句合成后拼接，提升长文本稳定性
            try:
                # 尝试解析结构化 JSON
                script_json = json.loads(text)
                assert isinstance(script_json, list)
                # 只合成每个对象的text字段内容，不朗读role、章节标题等
                text_list = [item['text'].strip() for item in script_json if 'text' in item and item['text'].strip()]
            except Exception:
                # 纯文本，按句号/换行分割
                text_list = [s.strip() for s in re.split(r'[。！？!?.\n]', text) if s.strip()]
            
            for seg in text_list:
                audio_piece = tts.synthesize_long_text(
                    seg, voice,
                    speed=speed, volume=int(volume), pitch=int(pitch), emotion=emotion, language=language
                )
                if audio_piece:
                    segment = AudioSegment.from_file(io.BytesIO(audio_piece), format="mp3")
                    combined_audio += segment
        
        # 将拼接好的音频导出为二进制格式
        buffer = io.BytesIO()
        combined_audio.export(buffer, format="mp3")
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type='audio/mpeg')

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@router.get('/api/task_list')
async def get_task_list():
    # 示例任务列表，可根据实际需求修改
    tasks = [
        {"id": 1, "name": "播客脚本生成", "status": "完成", "created_at": "2024-06-01 10:00:00"},
        {"id": 2, "name": "音频合成", "status": "进行中", "created_at": "2024-06-01 10:05:00"}
    ]
    return {"success": True, "tasks": tasks}

@router.post('/api/generate_podcast_script')
async def generate_podcast_script(payload: dict = Body(...)):
    try:
        print(f"DEBUG: Received payload for script generation: {payload}")
        content = payload.get('content')
        podcast_title = payload.get('podcast_title')
        podcast_host = payload.get('podcast_host')
        next_episode_preview = payload.get('next_episode_preview')
        podcast_mode = payload.get('podcast_mode', 'single')
        script_length = payload.get('scriptLength', 'medium')
        role1_name = payload.get('role1_name')
        role1_style = payload.get('role1_style')
        roleA_name = payload.get('roleA_name')
        roleA_style = payload.get('roleA_style')
        roleB_name = payload.get('roleB_name')
        roleB_style = payload.get('roleB_style')
        roleA_duty = payload.get('roleA_duty')
        roleB_duty = payload.get('roleB_duty')
        language = payload.get('language', 'zh')

        print("content:", content)
        print("generator:", generator)
        print("podcast_mode:", podcast_mode)
        print("role1_name:", role1_name, "roleA_name:", roleA_name, "roleB_name:", roleB_name)

        if not content:
            return JSONResponse(status_code=400, content={"error": "内容为空，无法生成播客脚本"})
        script = generator.generate_podcast_script(
            content=content,
            podcast_title=podcast_title,
            podcast_host=podcast_host,
            next_episode_preview=next_episode_preview,
            podcast_mode=podcast_mode,
            script_length=script_length,
            role1_name=role1_name,
            role1_style=role1_style,
            roleA_name=roleA_name,
            roleA_style=roleA_style,
            roleA_duty=roleA_duty,
            roleB_name=roleB_name,
            roleB_style=roleB_style,
            roleB_duty=roleB_duty,
            language=language
        )
        # 去除所有 markdown 代码块
        if isinstance(script, str):
            script = re.sub(r"^```[a-zA-Z]*\s*", "", script.strip())
            script = re.sub(r"```$", "", script.strip())
            script = script.strip()
        return {"success": True, "podcast_script": script}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000) 