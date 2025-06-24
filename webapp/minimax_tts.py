import os
import time
import requests
import json
import base64
from typing import Dict, Any, List
from dotenv import load_dotenv
import sys
import io
import traceback
from pydub import AudioSegment
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

class MiniMaxTTS:
    """MiniMax 同步语音合成 HTTP 客户端，支持分段拼接和voice_id查询"""
    def __init__(self):
        self.api_key = os.getenv("MINIMAX_API_KEY")
        self.group_id = os.getenv("MINIMAX_GROUP_ID")
        self.base_url = "https://api.minimaxi.com/v1/t2a_v2"
        self.voice_url = "https://api.minimaxi.com/v1/get_voice"
        if not self.api_key or not self.group_id:
            raise ValueError("请配置 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID 环境变量")

    def get_available_voices(self, model="speech-02-turbo"):
        url = "https://api.minimaxi.com/v1/get_voice"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {"voice_type": "all"}
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        print("TTS原始返回：", resp.text)
        result = resp.json()
        print("MiniMax get_voice API 返回：", result)
        # 兼容不同返回结构
        if 'system_voice' in result and isinstance(result['system_voice'], list):
            return result['system_voice']
        elif 'voices' in result and isinstance(result['voices'], list):
            return result['voices']
        else:
            return []

    def synthesize_text_sync(self, text: str, voice_id: str, model: str = "speech-02-turbo", speed: float = 1.0, volume: float = 1.0, pitch: float = 0.0, emotion: str = "neutral", format: str = "mp3", language: str = "zh") -> bytes:
        """
        同步合成单段文本，返回音频二进制（新版接口，参数嵌套，音频为hex编码）
        """
        print("本次合成文本长度：", len(text))
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        url = f"https://api.minimaxi.com/v1/t2a_v2?GroupId={self.group_id}"
        data = {
            "model": model,
            "text": str(text),
            "stream": False,
            "language_boost": language,
            "output_format": "hex",
            "voice_setting": {
                "voice_id": str(voice_id),
                "speed": float(speed),
                "vol": int(volume),
                "pitch": int(pitch),
                "emotion": emotion
            },
            "audio_setting": {
                "sample_rate": 32000,
                "bitrate": 128000,
                "format": format,
                "channel": 1
            }
        }
        print("TTS请求参数data:", data, flush=True)
        try:
            resp = requests.post(url, headers=headers, json=data, timeout=60)
            print("TTS原始返回：", resp.text)
            result = resp.json()
            if 'data' in result and 'audio' in result['data']:
                audio_hex = result['data']['audio']
                audio_bytes = bytes.fromhex(audio_hex)
                return audio_bytes
            else:
                raise Exception(f"TTS返回内容异常: {result}")
        except Exception as e:
            print("TTS请求异常：", e)
            import traceback; traceback.print_exc()
            raise Exception(f"同步TTS失败: {str(e)}")

    def synthesize_long_text(self, text: str, voice_id: str, model: str = "speech-02-turbo", max_length: int = 800, emotion: str = "neutral", format: str = "mp3", language: str = "zh", **kwargs) -> bytes:
        """
        长文本分段合成并拼接音频，返回完整音频二进制
        """
        segments = [text[i:i+max_length] for i in range(0, len(text), max_length)]
        
        # 使用 pydub 进行专业的音频拼接
        combined_audio = AudioSegment.empty()

        for idx, seg in enumerate(segments):
            print(f"正在合成第{idx+1}段，共{len(segments)}段...")
            audio_piece_bytes = self.synthesize_text_sync(seg, voice_id, model, kwargs.get('speed', 1.0), kwargs.get('volume', 1.0), kwargs.get('pitch', 0.0), emotion, format, language)
            
            # 将二进制音频转换为pydub的AudioSegment对象
            segment = AudioSegment.from_file(io.BytesIO(audio_piece_bytes), format="mp3")
            combined_audio += segment
        
        # 将拼接好的音频导出为二进制格式
        buffer = io.BytesIO()
        combined_audio.export(buffer, format="mp3")
        buffer.seek(0)
        
        return buffer.read()

tts_client = None

def get_tts_client() -> MiniMaxTTS:
    global tts_client
    if tts_client is None:
        tts_client = MiniMaxTTS()
    return tts_client 

if __name__ == "__main__":
    tts = get_tts_client()
    voices = tts.get_available_voices()
    print(voices)  # 打印所有voice_id
    # 任选一个voice_id测试
    audio = tts.synthesize_text_sync("你好，世界！", "male-qn-qingse")
    with open("test.mp3", "wb") as f:
        f.write(audio) 