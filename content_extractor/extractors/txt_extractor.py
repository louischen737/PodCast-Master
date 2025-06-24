import os
import re
from typing import Dict, List, Optional
from ..exceptions import NoValidContentError
from .base_extractor import BaseExtractor

class TXTExtractor(BaseExtractor):
    """文本文件内容提取器"""
    
    def __init__(self):
        super().__init__()
        # 定义标题模式
        self.heading_patterns = [
            # 中文章节标题
            (r'^第[一二三四五六七八九十百千万]+[章节篇]', 1),
            (r'^第[一二三四五六七八九十百千万]+[章节篇]\s+[^\n]+', 1),
            # 数字编号标题
            (r'^\d+\.\s+[^\n]+', 2),
            (r'^\d+\.\d+\.\s+[^\n]+', 3),
            # 英文标题
            (r'^[A-Z][a-z]+\s+[^\n]+', 2),
            (r'^[A-Z][A-Z\s]+$', 1),  # 全大写标题
            # 中文编号标题
            (r'^[一二三四五六七八九十]+、\s*[^\n]+', 2),
            # 特殊标题格式
            (r'^【[^】]+】', 2),
            (r'^\[[^\]]+\]', 2),
            (r'^（[^）]+）', 2),
            (r'^\([^)]+\)', 2),
        ]
        
        # 定义列表模式
        self.list_patterns = [
            # 数字编号列表
            (r'^\d+[\.、]\s*[^\n]+', 'number'),
            # 字母编号列表
            (r'^[a-z][\.、]\s*[^\n]+', 'alpha'),
            (r'^[A-Z][\.、]\s*[^\n]+', 'alpha_upper'),
            # 中文编号列表
            (r'^[一二三四五六七八九十]+[\.、]\s*[^\n]+', 'chinese'),
            # 项目符号列表
            (r'^[•\-\*]\s*[^\n]+', 'bullet'),
            # 其他列表标记
            (r'^[○●◆◇■□]\s*[^\n]+', 'symbol'),
        ]

    def extract(self, file_path: str) -> Dict:
        """
        从文本文件中提取内容
        
        Args:
            file_path: 文本文件路径
            
        Returns:
            Dict: 包含提取内容的字典
        """
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip():
                raise NoValidContentError("文件内容为空")
            
            # 提取元数据
            metadata = self._extract_metadata(file_path, content)
            
            # 提取内容
            structured_content = self._extract_content(content)
            
            if not structured_content:
                raise NoValidContentError("无法从文本文件中提取有效内容")
            
            # 提取关键点
            key_points = self._extract_key_points(structured_content)
            
            return {
                "source_type": "file",
                "title": metadata.get("title", os.path.basename(file_path)),
                "metadata": metadata,
                "content": structured_content,
                "key_points": key_points,
                "cautions": "文本文件可能包含特殊格式，当前仅提取纯文本内容"
            }
            
        except UnicodeDecodeError:
            raise NoValidContentError("文件编码不是UTF-8，请确保文件使用UTF-8编码")
        except Exception as e:
            raise NoValidContentError(f"文本文件处理失败: {str(e)}")
    
    def _extract_metadata(self, file_path: str, content: str) -> Dict:
        """
        提取文本文件元数据
        
        Args:
            file_path: 文件路径
            content: 文件内容
            
        Returns:
            Dict: 包含元数据的字典
        """
        # 获取文件基本信息
        file_stats = os.stat(file_path)
        
        # 尝试从内容中提取标题
        title = os.path.basename(file_path)
        first_line = content.split('\n')[0].strip()
        if len(first_line) <= 100:  # 假设标题不会太长
            title = first_line
        
        # 计算基本统计信息
        lines = content.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        
        return {
            "title": title,
            "file_size": file_stats.st_size,
            "created_time": str(file_stats.st_ctime),
            "modified_time": str(file_stats.st_mtime),
            "total_lines": len(lines),
            "non_empty_lines": len(non_empty_lines),
            "word_count": len(content.split())
        }
    
    def _extract_content(self, content: str) -> List[Dict]:
        """
        提取文本文件内容并结构化
        
        Args:
            content: 文件内容
            
        Returns:
            List[Dict]: 包含内容的列表
        """
        structured_content = []
        current_section = "未命名章节"
        current_list = None
        
        # 分割成段落
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        for para in paragraphs:
            # 检查是否是标题
            if self._is_heading(para):
                current_section = para
                structured_content.append({
                    "section_title": para,
                    "text": "",
                    "content_type": "heading",
                    "level": self._get_heading_level(para)
                })
                current_list = None
            else:
                # 检查是否是列表项
                if self._is_list_item(para):
                    items = self._extract_list_items(para)
                    if items:
                        structured_content.append({
                            "section_title": current_section,
                            "text": items,
                            "content_type": "list",
                            "list_type": items[0]['type']
                        })
                else:
                    # 普通段落
                    structured_content.append({
                        "section_title": current_section,
                        "text": para,
                        "content_type": "paragraph"
                    })
        
        return structured_content
    
    def _is_heading(self, text: str) -> bool:
        """
        判断文本是否是标题
        
        Args:
            text: 要检查的文本
            
        Returns:
            bool: 是否是标题
        """
        # 标题通常较短，且不以标点符号结尾
        if len(text) > 100 or text[-1] in '。，！？':
            return False
            
        # 检查是否是列表项（避免将列表项误识别为标题）
        if self._is_list_item(text):
            return False
            
        # 检查标题模式
        return any(re.match(pattern, text) for pattern, _ in self.heading_patterns)
    
    def _get_heading_level(self, text: str) -> int:
        """
        获取标题的层级
        
        Args:
            text: 标题文本
            
        Returns:
            int: 标题层级（1-3）
        """
        for pattern, level in self.heading_patterns:
            if re.match(pattern, text):
                return level
        return 1
    
    def _is_list_item(self, text: str) -> bool:
        """
        判断文本是否是列表项
        
        Args:
            text: 要检查的文本
            
        Returns:
            bool: 是否是列表项
        """
        # 检查列表模式
        return any(re.match(pattern, text) for pattern, _ in self.list_patterns)
    
    def _get_list_type(self, text: str) -> str:
        """
        获取列表类型
        
        Args:
            text: 列表项文本
            
        Returns:
            str: 列表类型
        """
        for pattern, list_type in self.list_patterns:
            if re.match(pattern, text):
                return list_type
        return 'unknown'
    
    def _extract_list_items(self, text: str) -> List[Dict]:
        """
        从文本中提取列表项
        
        Args:
            text: 包含列表项的文本
            
        Returns:
            List[Dict]: 列表项列表，包含类型信息
        """
        # 分割成行
        lines = text.split('\n')
        items = []
        current_type = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 获取列表类型
            list_type = self._get_list_type(line)
            if list_type != 'unknown':
                current_type = list_type
                # 移除列表标记
                item = re.sub(r'^[\d一二三四五六七八九十]+[\.、]', '', line)
                item = re.sub(r'^[•\-\*○●◆◇■□]\s*', '', item)
                items.append({
                    'text': item.strip(),
                    'type': list_type
                })
        
        return items
    
    def _extract_key_points(self, content: List[Dict]) -> List[str]:
        """
        从内容中提取关键点
        
        Args:
            content: 内容列表
            
        Returns:
            List[str]: 关键点列表
        """
        return [] # 将关键点提取逻辑清空，由AI模块负责 