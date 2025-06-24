from fastapi import APIRouter, Request, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from content_extractor import ContentExtractor
from ai_parser.podcast_generator import PodcastGenerator
import shutil
import os

# 从 config.py 导入 templates 实例
from .config import templates

router = APIRouter()
extractor = ContentExtractor()
podcast_generator = PodcastGenerator()
UPLOAD_DIR = '/tmp/content_uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get('/', response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse('index.html', {"request": request})

@router.post('/extract')
async def extract(request: Request, 
                  file: UploadFile = File(None), 
                  url: str = Form(None),
                  podcast_title: str = Form(None),
                  next_episode_preview: str = Form(None),
                  podcast_mode: str = Form('single'),
                  role1_name: str = Form(None),
                  role1_style: str = Form(None),
                  roleA_name: str = Form(None),
                  roleA_style: str = Form(None),
                  roleB_name: str = Form(None),
                  roleB_style: str = Form(None)
                 ):
    print("DEBUG: /extract endpoint hit.")
    extracted_content = None
    file_path = None

    if file and file.filename:
        filename = file.filename
        file_path = os.path.join(UPLOAD_DIR, filename)
        print(f"DEBUG: Processing file upload: {filename}")
        try:
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file.file, f)
            print(f"DEBUG: File saved to {file_path}. Starting extraction...")
            extracted_content = extractor.process_file(file_path)
            print("DEBUG: File extraction complete.")
        except Exception as e:
            print(f"ERROR: File processing failed: {e}")
            raise HTTPException(status_code=400, detail=f"文件处理失败: {e}")
        finally:
            if file_path and os.path.exists(file_path) and os.path.isfile(file_path):
                os.remove(file_path)
                print(f"DEBUG: Temporary file {file_path} removed.")
    elif url:
        print(f"DEBUG: Processing URL: {url}")
        try:
            extracted_content = extractor.process_url(url)
            print("DEBUG: URL extraction complete.")
        except Exception as e:
            print(f"ERROR: URL processing failed: {e}")
            raise HTTPException(status_code=400, detail=f"URL处理失败: {e}")
    else:
        print("ERROR: No file or URL provided.")
        raise HTTPException(status_code=400, detail="请上传文件或输入URL")
    
    if not extracted_content:
        print("ERROR: No valid content extracted.")
        raise HTTPException(status_code=400, detail="未能提取到有效内容")

    print("DEBUG: Content extracted successfully. Starting podcast script generation...")
    try:
        podcast_script = podcast_generator.generate_podcast_script(
            extracted_content,
            podcast_title=podcast_title,
            next_episode_preview=next_episode_preview,
            podcast_mode=podcast_mode,
            role1_name=role1_name,
            role1_style=role1_style,
            roleA_name=roleA_name,
            roleA_style=roleA_style,
            roleB_name=roleB_name,
            roleB_style=roleB_style
        )
        print("DEBUG: Podcast script generation complete. Returning response.")
        return JSONResponse(content={'podcast_script': podcast_script})
    except Exception as e:
        print(f"ERROR: Podcast script generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"播客脚本生成失败: {e}")