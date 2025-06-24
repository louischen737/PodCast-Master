import os
import json
from typing import Dict, List, Union, Optional
from .extractors.pdf_extractor import PDFExtractor
from .extractors.doc_extractor import DocExtractor
from .extractors.web_extractor import WebExtractor
from .extractors.txt_extractor import TXTExtractor
from .exceptions import (
    UnsupportedFormatError,
    AccessDeniedError,
    NoValidContentError,
    FileNotFoundError
)

class ContentExtractor:
    """内容提取引擎的主类"""
    
    def __init__(self):
        self.extractors = {
            '.pdf': PDFExtractor(),
            '.docx': DocExtractor(),
            '.doc': DocExtractor(),
            '.txt': TXTExtractor()
        }
        self.web_extractor = WebExtractor()

    def process_file(self, file_path: str) -> Dict:
        """
        处理文件并提取内容
        
        Args:
            file_path: 文件路径
            
        Returns:
            Dict: 包含提取内容的字典
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
            
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in self.extractors:
            raise UnsupportedFormatError(f"不支持的文件格式: {file_ext}")
            
        extractor = self.extractors[file_ext]
        return extractor.extract(file_path)

    def process_url(self, url: str) -> Dict:
        """
        处理网页并提取内容
        
        Args:
            url: 网页URL
            
        Returns:
            Dict: 包含提取内容的字典
        """
        return self.web_extractor.extract(url)

    def _format_output(self, 
                      source_type: str,
                      title: str,
                      metadata: Dict,
                      content: List[Dict],
                      key_points: Optional[List[str]] = None,
                      cautions: Optional[str] = None) -> Dict:
        """格式化输出结果"""
        return {
            "source_type": source_type,
            "title": title,
            "metadata": metadata,
            "content": content,
            "key_points": key_points or [],
            "cautions": cautions
        } 