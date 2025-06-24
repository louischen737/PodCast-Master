# 工具函数，可根据需要扩展

def allowed_file(filename: str, allowed_exts=None) -> bool:
    if allowed_exts is None:
        allowed_exts = {'.pdf', '.docx', '.txt'}
    return any(filename.lower().endswith(ext) for ext in allowed_exts) 