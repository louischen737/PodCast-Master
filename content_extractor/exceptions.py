class ContentExtractorError(Exception):
    """内容提取器基础异常类"""
    pass

class UnsupportedFormatError(ContentExtractorError):
    """不支持的文件格式异常"""
    pass

class AccessDeniedError(ContentExtractorError):
    """访问受限异常"""
    pass

class NoValidContentError(ContentExtractorError):
    """无法提取有效内容异常"""
    pass

class FileNotFoundError(ContentExtractorError):
    """文件不存在异常"""
    pass 