import unittest
import os
from content_extractor.extractors.doc_extractor import DocExtractor
from content_extractor.exceptions import NoValidContentError, FileNotFoundError, UnsupportedFormatError
from content_extractor import ContentExtractor

class TestDocExtractor(unittest.TestCase):
    def setUp(self):
        self.doc_extractor = DocExtractor()
        self.test_file_path = "tests/data/test.docx"
        self.non_existent_file_path = "tests/data/nonexistent.docx"
        self.non_doc_file_path = "tests/data/non_doc.docx"

        # 创建一个非Word文件，用于测试DocExtractor处理非Word文件的情况
        with open("tests/data/non_doc.txt", "w") as f:
            f.write("这是一个文本文件，不是Word文档。")

    def tearDown(self):
        # 清理测试创建的文件
        if os.path.exists("tests/data/non_doc.txt"):
            os.remove("tests/data/non_doc.txt")

    def test_extract_valid_doc(self):
        """测试有效Word文档的提取"""
        if not os.path.exists(self.test_file_path):
            self.skipTest(f"跳过测试：{self.test_file_path} 文件不存在，请放置一个有效的test.docx文件。")
            
        try:
            result = self.doc_extractor.extract(self.test_file_path)

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
            self.assertIn("author", metadata)
            self.assertIn("created", metadata)
            self.assertIn("modified", metadata)
            self.assertIn("paragraph_count", metadata)
            self.assertIn("section_count", metadata)

            # 验证内容
            self.assertGreater(len(result["content"]), 0)
            for item in result["content"]:
                self.assertIn("section_title", item)
                self.assertIn("text", item)
                self.assertIn("content_type", item)
                if item["content_type"] == "heading":
                    self.assertIn("level", item)

        except NoValidContentError as e:
            self.fail(f"有效Word文档提取失败，但被标记为无效内容: {e}")
        except Exception as e:
            self.fail(f"处理有效Word文档时发生意外错误: {e}")

    def test_extract_non_existent_file(self):
        """测试DocExtractor处理不存在的文件"""
        with self.assertRaises(NoValidContentError):
            self.doc_extractor.extract(self.non_existent_file_path)

    def test_extract_non_doc_content(self):
        """测试DocExtractor处理非Word文件（即使扩展名是.docx）"""
        # 创建一个非Word文件但命名为.docx，模拟传入错误类型的文件
        temp_non_doc_path = "tests/data/temp_non_doc.docx"
        with open(temp_non_doc_path, "w") as f:
            f.write("这是一个假Word文件，内容是纯文本。")
        
        with self.assertRaises(NoValidContentError):
            self.doc_extractor.extract(temp_non_doc_path)

        os.remove(temp_non_doc_path)


class TestContentExtractorDocIntegration(unittest.TestCase):
    def setUp(self):
        self.extractor = ContentExtractor()
        self.test_doc_file_path = "tests/data/test.docx"
        self.non_existent_file_path = "tests/data/nonexistent.docx"
        self.unsupported_file_path = "tests/data/unsupported.xyz"

    def tearDown(self):
        # 清理测试创建的文件
        if os.path.exists(self.unsupported_file_path):
            os.remove(self.unsupported_file_path)

    def test_process_file_doc_integration(self):
        """测试ContentExtractor处理Word文档的集成"""
        if not os.path.exists(self.test_doc_file_path):
            self.skipTest(f"跳过测试：{self.test_doc_file_path} 文件不存在，请放置一个有效的test.docx文件。")

        result = self.extractor.process_file(self.test_doc_file_path)
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