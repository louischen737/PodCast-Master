import os
import json
from fastapi.templating import Jinja2Templates

# Jinja2模板初始化
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), 'templates'))

# 自定义Jinaj2过滤器，用于输出不转义的JSON
def to_json_unescaped(value, indent=None):
    return json.dumps(value, indent=indent, ensure_ascii=False)

templates.env.filters['tojson_unescaped'] = to_json_unescaped 