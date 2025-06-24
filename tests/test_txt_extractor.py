import unittest
import os
from content_extractor.extractors.txt_extractor import TXTExtractor
from content_extractor.exceptions import NoValidContentError, FileNotFoundError, UnsupportedFormatError
from content_extractor import ContentExtractor

class TestTXTExtractor(unittest.TestCase):
    def setUp(self):
        self.txt_extractor = TXTExtractor()
        self.test_file_path = "tests/data/test.txt"
        self.non_existent_file_path = "tests/data/nonexistent.txt"
        
        # 创建测试文件
        self._create_test_files()

    def tearDown(self):
        # 清理测试文件
        self._cleanup_test_files()

    def _create_test_files(self):
        """创建测试用的文本文件"""
        # 创建有效的测试文件
        test_content = """第一章 引言
这是第一章节的内容。

1. 第一个要点
2. 第二个要点
3. 第三个要点

第二章 主要内容
这是第二章节的内容。

• 项目一
• 项目二
• 项目三

这是最后一个段落。"""
        
        os.makedirs("tests/data", exist_ok=True)
        with open(self.test_file_path, "w", encoding="utf-8") as f:
            f.write(test_content)

    def _cleanup_test_files(self):
        """清理测试文件"""
        if os.path.exists(self.test_file_path):
            os.remove(self.test_file_path)

    def test_extract_valid_txt(self):
        """测试有效文本文件的提取"""
        try:
            result = self.txt_extractor.extract(self.test_file_path)

            self.assertIsInstance(result, dict)
            self.assertIn("source_type", result)
            self.assertEqual(result["source_type"], "file")
            self.assertIn("title", result)
            self.assertIsInstance(result["title"], str)
            self.assertIn("metadata", result)
            self.assertIsInstance(result["metadata"], dict)
            self.assertIn("content", result)
            self.assertIsInstance(result["content"], list)
            self.assertIn("key_points", result)
            self.assertIsInstance(result["key_points"], list)
            self.assertIn("cautions", result)
            self.assertIsInstance(result["cautions"], str)

            # 验证元数据
            metadata = result["metadata"]
            self.assertIn("title", metadata)
            self.assertIn("file_size", metadata)
            self.assertIn("created_time", metadata)
            self.assertIn("modified_time", metadata)
            self.assertIn("total_lines", metadata)
            self.assertIn("non_empty_lines", metadata)
            self.assertIn("word_count", metadata)

            # 验证内容结构
            content = result["content"]
            self.assertGreater(len(content), 0)
            
            # 验证标题识别
            headings = [item for item in content if item["content_type"] == "heading"]
            self.assertGreater(len(headings), 0)
            
            # 验证列表识别
            lists = [item for item in content if item["content_type"] == "list"]
            self.assertGreater(len(lists), 0)
            
            # 验证段落识别
            paragraphs = [item for item in content if item["content_type"] == "paragraph"]
            self.assertGreater(len(paragraphs), 0)

        except NoValidContentError as e:
            self.fail(f"有效文本文件提取失败，但被标记为无效内容: {e}")
        except Exception as e:
            self.fail(f"处理有效文本文件时发生意外错误: {e}")

    def test_extract_empty_file(self):
        """测试空文件处理"""
        empty_file_path = "tests/data/empty.txt"
        with open(empty_file_path, "w", encoding="utf-8") as f:
            f.write("")
        
        with self.assertRaises(NoValidContentError):
            self.txt_extractor.extract(empty_file_path)
        
        os.remove(empty_file_path)

    def test_extract_non_existent_file(self):
        """测试TXTExtractor处理不存在的文件"""
        with self.assertRaises(NoValidContentError):
            self.txt_extractor.extract(self.non_existent_file_path)

    def test_extract_non_utf8_file(self):
        """测试非UTF-8编码文件处理"""
        non_utf8_file_path = "tests/data/non_utf8.txt"
        with open(non_utf8_file_path, "w", encoding="gbk") as f:
            f.write("这是一个GBK编码的文件")
        
        with self.assertRaises(NoValidContentError):
            self.txt_extractor.extract(non_utf8_file_path)
        
        os.remove(non_utf8_file_path)


class TestContentExtractorTXTIntegration(unittest.TestCase):
    def setUp(self):
        self.extractor = ContentExtractor()
        self.test_txt_file_path = "tests/data/test.txt"
        self.non_existent_file_path = "tests/data/nonexistent.txt"
        self.unsupported_file_path = "tests/data/unsupported.xyz"

    def tearDown(self):
        # 清理测试文件
        if os.path.exists(self.unsupported_file_path):
            os.remove(self.unsupported_file_path)

    def test_process_file_txt_integration(self):
        """测试ContentExtractor处理文本文件的集成"""
        if not os.path.exists(self.test_txt_file_path):
            self.skipTest(f"跳过测试：{self.test_txt_file_path} 文件不存在")

        result = self.extractor.process_file(self.test_txt_file_path)
        self.assertIsInstance(result, dict)
        self.assertEqual(result["source_type"], "file")
        self.assertGreater(len(result["content"]), 0)

    def test_process_non_existent_file(self):
        """测试ContentExtractor处理不存在文件"""
        with self.assertRaises(FileNotFoundError):
            self.extractor.process_file(self.non_existent_file_path)

    def test_process_unsupported_format(self):
        """测试ContentExtractor处理不支持文件格式"""
        # 创建一个空文件来模拟不支持的格式
        with open(self.unsupported_file_path, "w") as f:
            f.write("This is a test.")

        with self.assertRaises(UnsupportedFormatError):
            self.extractor.process_file(self.unsupported_file_path)

if __name__ == '__main__':
    unittest.main() 