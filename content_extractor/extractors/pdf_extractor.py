import os
from typing import Dict, List, Optional
from PyPDF2 import PdfReader
from ..exceptions import NoValidContentError
from .base_extractor import BaseExtractor

class PDFExtractor(BaseExtractor):
    """PDF文件内容提取器"""
    
    def extract(self, file_path: str) -> Dict:
        """
        从PDF文件中提取内容
        
        Args:
            file_path: PDF文件路径
            
        Returns:
            Dict: 包含提取内容的字典
        """
        try:
            reader = PdfReader(file_path)
            
            # 提取元数据
            metadata = self._extract_metadata(reader)
            
            # 提取内容
            content = self._extract_content(reader)
            
            if not content:
                raise NoValidContentError("无法从PDF中提取有效内容")
            
            # 提取关键点
            key_points = self._extract_key_points(content)
            
            return {
                "source_type": "file",
                "title": metadata.get("title", os.path.basename(file_path)),
                "metadata": metadata,
                "content": content,
                "key_points": key_points,
                "cautions": "PDF文件可能包含图片和表格，当前仅提取文本内容"
            }
            
        except Exception as e:
            raise NoValidContentError(f"PDF处理失败: {str(e)}")
    
    def _extract_metadata(self, reader: PdfReader) -> Dict:
        """
        提取PDF元数据
        
        Args:
            reader: PdfReader实例
            
        Returns:
            Dict: 包含元数据的字典
        """
        metadata = {}
        info = reader.metadata
        
        if info:
            metadata = {
                "author": info.get("/Author", ""),
                "creator": info.get("/Creator", ""),
                "producer": info.get("/Producer", ""),
                "subject": info.get("/Subject", ""),
                "title": info.get("/Title", ""),
                "page_count": len(reader.pages)
            }
        
        return metadata
    
    def _extract_content(self, reader: PdfReader) -> List[Dict]:
        """
        提取PDF内容
        
        Args:
            reader: PdfReader实例
            
        Returns:
            List[Dict]: 包含内容的列表
        """
        content = []
        
        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            if text.strip():
                content.append({
                    "section_title": f"第{page_num}页",
                    "text": text,
                    "content_type": "paragraph",
                    "page_number": page_num
                })
        
        return content
    
    def _extract_key_points(self, content: List[Dict]) -> List[str]:
        """
        从内容中提取关键点
        
        Args:
            content: 内容列表
            
        Returns:
            List[str]: 关键点列表
        """
        return [] # 将关键点提取逻辑清空，由AI模块负责 