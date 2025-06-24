import unittest
import os
from content_extractor.extractors.pdf_extractor import PDFExtractor
from content_extractor.exceptions import NoValidContentError, FileNotFoundError, UnsupportedFormatError
from content_extractor import ContentExtractor # 引入ContentExtractor用于集成测试

class TestPDFExtractor(unittest.TestCase):
    def setUp(self):
        self.pdf_extractor = PDFExtractor()
        self.test_file_path = "tests/data/test.pdf"
        self.non_existent_file_path = "tests/data/nonexistent.pdf"
        self.non_pdf_file_path = "tests/data/non_pdf.pdf" # 用于测试非PDF文件但扩展名为.pdf的情况

        # 创建一个非PDF文件，用于测试PDFExtractor处理非PDF文件的情况
        with open("tests/data/non_pdf.txt", "w") as f:
            f.write("这是一个文本文件，不是PDF。")

    def tearDown(self):
        # 清理测试创建的文件
        if os.path.exists("tests/data/non_pdf.txt"):
            os.remove("tests/data/non_pdf.txt")

    def test_extract_valid_pdf(self):
        """测试有效PDF文件的提取"""
        if not os.path.exists(self.test_file_path):
            self.skipTest(f"跳过测试：{self.test_file_path} 文件不存在，请放置一个有效的test.pdf文件。")
            
        try:
            result = self.pdf_extractor.extract(self.test_file_path)

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

            self.assertGreater(len(result["content"]), 0)
            for item in result["content"]:
                self.assertIn("section_title", item)
                self.assertIn("text", item)
                self.assertIn("content_type", item)
                self.assertIn("page_number", item)

        except NoValidContentError as e:
            self.fail(f"有效PDF文件提取失败，但被标记为无效内容: {e}")
        except Exception as e:
            self.fail(f"处理有效PDF文件时发生意外错误: {e}")

    def test_extract_non_existent_file(self):
        """测试PDFExtractor处理不存在的文件"""
        with self.assertRaises(NoValidContentError):
            self.pdf_extractor.extract(self.non_existent_file_path)

    def test_extract_non_pdf_content(self):
        """测试PDFExtractor处理非PDF文件（即使扩展名是.pdf）"""
        # 创建一个非PDF文件但命名为.pdf，模拟传入错误类型的文件
        temp_non_pdf_path = "tests/data/temp_non_pdf.pdf"
        with open(temp_non_pdf_path, "w") as f:
            f.write("这是一个假PDF文件，内容是纯文本。")
        
        with self.assertRaises(NoValidContentError): # PyPDF2会失败，然后PDFExtractor会抛出NoValidContentError
            self.pdf_extractor.extract(temp_non_pdf_path)

        os.remove(temp_non_pdf_path)


class TestContentExtractorIntegration(unittest.TestCase):
    def setUp(self):
        self.extractor = ContentExtractor()
        self.test_pdf_file_path = "tests/data/test.pdf" # 用于集成测试的PDF文件
        self.non_existent_file_path = "tests/data/nonexistent.pdf"
        self.unsupported_file_path = "tests/data/unsupported.xyz"

    def tearDown(self):
        # 清理测试创建的文件
        if os.path.exists(self.unsupported_file_path):
            os.remove(self.unsupported_file_path)

    def test_process_file_pdf_integration(self):
        """测试ContentExtractor处理PDF文件的集成"""
        if not os.path.exists(self.test_pdf_file_path):
            self.skipTest(f"跳过测试：{self.test_pdf_file_path} 文件不存在，请放置一个有效的test.pdf文件。")

        result = self.extractor.process_file(self.test_pdf_file_path)
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