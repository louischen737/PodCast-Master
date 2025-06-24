import re
import requests
from typing import Dict, List, Optional
from readability import Document
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from ..exceptions import NoValidContentError, AccessDeniedError
from .base_extractor import BaseExtractor

class WebExtractor(BaseExtractor):
    """网页内容提取器"""
    
    def __init__(self):
        super().__init__()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        self.timeout = 30  # 增加超时时间
        
    def extract(self, url: str) -> Dict:
        """
        从URL提取网页内容
        
        Args:
            url: 网页URL
            
        Returns:
            Dict: 包含提取内容的字典
            
        Raises:
            NoValidContentError: 无法提取有效内容
            AccessDeniedError: 访问被拒绝
        """
        try:
            # 验证URL格式
            if not self._is_valid_url(url):
                raise NoValidContentError("无效的URL格式")
            
            # 获取网页内容
            response = self._fetch_url(url)
            if not response:
                raise NoValidContentError("无法获取网页内容")
            
            # 使用readability提取主要内容
            doc = Document(response.text)
            title = doc.title()
            content = doc.summary()
            
            # 使用BeautifulSoup解析内容
            soup = BeautifulSoup(content, 'html.parser')
            
            # 提取元数据
            metadata = self._extract_metadata(soup, response)
            
            # 提取结构化内容
            structured_content = self._extract_content(soup)
            
            # 如果没有提取到内容，尝试直接从原始HTML提取
            if not structured_content:
                structured_content = self._extract_from_raw_html(response.text)
            
            # 提取关键点
            key_points = self._extract_key_points(structured_content)
            
            # 检查内容是否为空
            if not structured_content:
                raise NoValidContentError("无法提取有效内容")
            
            return {
                "source_type": "web",
                "title": title,
                "metadata": metadata,
                "content": structured_content,
                "key_points": key_points,
                "cautions": "网页内容可能包含广告或其他无关内容"
            }
            
        except requests.exceptions.RequestException as e:
            if "403" in str(e):
                raise AccessDeniedError("访问被拒绝")
            raise NoValidContentError(f"获取网页内容失败: {str(e)}")
        except Exception as e:
            raise NoValidContentError(f"提取内容失败: {str(e)}")
    
    def _is_valid_url(self, url: str) -> bool:
        """
        验证URL格式
        
        Args:
            url: 要验证的URL
            
        Returns:
            bool: URL是否有效
        """
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def _fetch_url(self, url: str) -> Optional[requests.Response]:
        """
        获取网页内容
        
        Args:
            url: 网页URL
            
        Returns:
            Optional[requests.Response]: 响应对象
        """
        session = requests.Session()
        response = session.get(url, headers=self.headers, timeout=self.timeout)
        response.raise_for_status()
        return response
    
    def _extract_metadata(self, soup: BeautifulSoup, response: requests.Response) -> Dict:
        """
        提取网页元数据
        
        Args:
            soup: BeautifulSoup对象
            response: 响应对象
            
        Returns:
            Dict: 元数据字典
        """
        metadata = {
            "url": response.url,
            "domain": urlparse(response.url).netloc,
            "content_type": response.headers.get('content-type', ''),
            "last_modified": response.headers.get('last-modified', ''),
            "encoding": response.encoding
        }
        
        # 提取meta标签信息
        meta_tags = soup.find_all('meta')
        for tag in meta_tags:
            if tag.get('name') and tag.get('content'):
                metadata[tag['name']] = tag['content']
            elif tag.get('property') and tag.get('content'):
                metadata[tag['property']] = tag['content']
        
        # 提取文章信息
        article = soup.find('article')
        if article:
            metadata['has_article'] = True
            metadata['article_class'] = article.get('class', [])
        
        return metadata
    
    def _extract_content(self, soup: BeautifulSoup) -> List[Dict]:
        """
        提取结构化内容
        
        Args:
            soup: BeautifulSoup对象
            
        Returns:
            List[Dict]: 结构化内容列表
        """
        structured_content = []
        current_section = "正文"
        
        # 处理标题
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            level = int(heading.name[1])
            text = heading.get_text(strip=True)
            if text:
                structured_content.append({
                    "section_title": text,
                    "text": "",
                    "content_type": "heading",
                    "level": level
                })
                current_section = text
        
        # 处理段落
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            if text and len(text) > 10:  # 过滤短文本
                structured_content.append({
                    "section_title": current_section,
                    "text": text,
                    "content_type": "paragraph"
                })
        
        # 处理列表
        for ul in soup.find_all(['ul', 'ol']):
            items = []
            for li in ul.find_all('li'):
                text = li.get_text(strip=True)
                if text:
                    items.append({
                        "text": text,
                        "type": "bullet" if ul.name == 'ul' else "number"
                    })
            
            if items:
                structured_content.append({
                    "section_title": current_section,
                    "text": items,
                    "content_type": "list",
                    "list_type": "bullet" if ul.name == 'ul' else "number"
                })
        
        return structured_content
    
    def _extract_from_raw_html(self, html: str) -> List[Dict]:
        """
        从原始HTML提取内容
        
        Args:
            html: HTML内容
            
        Returns:
            List[Dict]: 结构化内容列表
        """
        soup = BeautifulSoup(html, 'html.parser')
        structured_content = []
        current_section = "正文"
        
        # 移除脚本和样式
        for script in soup(["script", "style"]):
            script.decompose()
        
        # 查找主要内容区域
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|main|article', re.I))
        
        if main_content:
            # 处理标题
            for heading in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                level = int(heading.name[1])
                text = heading.get_text(strip=True)
                if text:
                    structured_content.append({
                        "section_title": text,
                        "text": "",
                        "content_type": "heading",
                        "level": level
                    })
                    current_section = text
            
            # 处理段落
            for p in main_content.find_all('p'):
                text = p.get_text(strip=True)
                if text and len(text) > 10:
                    structured_content.append({
                        "section_title": current_section,
                        "text": text,
                        "content_type": "paragraph"
                    })
            
            # 处理列表
            for ul in main_content.find_all(['ul', 'ol']):
                items = []
                for li in ul.find_all('li'):
                    text = li.get_text(strip=True)
                    if text:
                        items.append({
                            "text": text,
                            "type": "bullet" if ul.name == 'ul' else "number"
                        })
                
                if items:
                    structured_content.append({
                        "section_title": current_section,
                        "text": items,
                        "content_type": "list",
                        "list_type": "bullet" if ul.name == 'ul' else "number"
                    })
        
        return structured_content
    
    def _extract_key_points(self, content: List[Dict]) -> List[str]:
        """
        提取关键点
        
        Args:
            content: 结构化内容列表
            
        Returns:
            List[str]: 关键点列表
        """
        return [] # 将关键点提取逻辑清空，由AI模块负责 