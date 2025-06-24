from abc import ABC, abstractmethod
from typing import Dict, List, Optional

class BaseExtractor(ABC):
    """内容提取器基类"""
    
    @abstractmethod
    def extract(self, source: str) -> Dict:
        """
        从源中提取内容
        
        Args:
            source: 源文件路径或URL
            
        Returns:
            Dict: 包含提取内容的字典
        """
        pass
    
    def _extract_metadata(self, source: str) -> Dict:
        """
        提取元数据
        
        Args:
            source: 源文件路径或URL
            
        Returns:
            Dict: 包含元数据的字典
        """
        return {}
    
    def _extract_content(self, source: str) -> List[Dict]:
        """
        提取主要内容
        
        Args:
            source: 源文件路径或URL
            
        Returns:
            List[Dict]: 包含内容的列表
        """
        return []
    
    def _extract_key_points(self, content: List[Dict]) -> List[str]:
        """
        提取关键点
        
        Args:
            content: 内容列表
            
        Returns:
            List[str]: 关键点列表
        """
        return [] 