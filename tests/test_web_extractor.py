import unittest
import os
from content_extractor.extractors.web_extractor import WebExtractor
from content_extractor.exceptions import NoValidContentError, AccessDeniedError

class TestWebExtractor(unittest.TestCase):
    """测试网页内容提取器"""
    
    def setUp(self):
        self.extractor = WebExtractor()
        self.test_url = "https://example.com"  # 使用一个稳定的测试网站
    
    def test_extract_valid_url(self):
        """测试提取有效URL的内容"""
        result = self.extractor.extract(self.test_url)
        
        # 验证基本结构
        self.assertIsInstance(result, dict)
        self.assertEqual(result["source_type"], "web")
        self.assertIn("title", result)
        self.assertIn("metadata", result)
        self.assertIn("content", result)
        self.assertIn("key_points", result)
        self.assertIn("cautions", result)
        
        # 验证元数据
        metadata = result["metadata"]
        self.assertIn("url", metadata)
        self.assertIn("domain", metadata)
        self.assertIn("content_type", metadata)
        
        # 验证内容结构
        content = result["content"]
        self.assertIsInstance(content, list)
        if content:
            self.assertIn("section_title", content[0])
            self.assertIn("text", content[0])
            self.assertIn("content_type", content[0])
    
    def test_extract_invalid_url(self):
        """测试提取无效URL"""
        with self.assertRaises(NoValidContentError):
            self.extractor.extract("invalid-url")
    
    def test_extract_non_existent_url(self):
        """测试提取不存在的URL"""
        with self.assertRaises(NoValidContentError):
            self.extractor.extract("https://this-url-does-not-exist.com")
    
    def test_extract_access_denied(self):
        """测试访问被拒绝的情况"""
        # 使用一个已知会返回403的URL
        with self.assertRaises(AccessDeniedError):
            self.extractor.extract("https://example.com/403")

class TestContentExtractorWebIntegration(unittest.TestCase):
    """测试网页提取器与内容提取器的集成"""
    
    def setUp(self):
        from content_extractor import ContentExtractor
        self.extractor = ContentExtractor()
    
    def test_process_url_web_integration(self):
        """测试处理URL的集成功能"""
        result = self.extractor.process_url("https://example.com")
        
        # 验证基本结构
        self.assertIsInstance(result, dict)
        self.assertEqual(result["source_type"], "web")
        self.assertIn("title", result)
        self.assertIn("metadata", result)
        self.assertIn("content", result)
        self.assertIn("key_points", result)
        self.assertIn("cautions", result)
        
        # 验证内容不为空
        self.assertTrue(len(result["content"]) > 0)
    
    def test_process_invalid_url(self):
        """测试处理无效URL"""
        with self.assertRaises(NoValidContentError):
            self.extractor.process_url("invalid-url")
    
    def test_process_non_existent_url(self):
        """测试处理不存在的URL"""
        with self.assertRaises(NoValidContentError):
            self.extractor.process_url("https://this-url-does-not-exist.com")

if __name__ == '__main__':
    unittest.main() 