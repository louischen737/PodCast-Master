import unittest
import os
from dotenv import load_dotenv
from ai_parser.podcast_generator import PodcastGenerator

class TestPodcastGenerator(unittest.TestCase):
    def setUp(self):
        """测试前的准备工作"""
        # 加载环境变量
        load_dotenv()
        
        # 检查环境变量
        api_key = os.getenv("ARK_API_KEY")
        api_secret = os.getenv("ARK_API_SECRET")
        
        print("\n环境变量检查:")
        print(f"ARK_API_KEY: {'已设置' if api_key else '未设置'}")
        print(f"ARK_API_SECRET: {'已设置' if api_secret else '未设置'}")
        
        if not api_key or not api_secret:
            raise ValueError("请确保在.env文件中设置了正确的ARK_API_KEY和ARK_API_SECRET")
        
        self.generator = PodcastGenerator()
        
        # 测试用的示例内容
        self.test_content = {
            "title": "人工智能在医疗领域的应用",
            "metadata": {
                "author": "张三",
                "date": "2024-03-20",
                "source": "科技日报"
            },
            "content": [
                {
                    "section_title": "引言",
                    "text": "人工智能正在深刻改变医疗行业。从疾病诊断到药物研发，AI技术都在发挥着越来越重要的作用。"
                },
                {
                    "section_title": "AI在医疗诊断中的应用",
                    "text": "在医疗诊断领域，AI系统可以通过分析医学影像，帮助医生更准确地识别疾病。例如，在肺部CT扫描中，AI可以快速识别出可疑的结节，提高早期肺癌的检出率。"
                },
                {
                    "section_title": "AI在药物研发中的突破",
                    "text": "在药物研发方面，AI可以大大缩短新药开发周期。通过分析海量的分子结构数据，AI可以预测潜在的药物分子，加速新药的发现过程。"
                }
            ],
            "key_points": [
                "AI在医疗诊断中提高准确率",
                "AI加速药物研发过程",
                "AI改善医疗资源分配"
            ]
        }

    def test_generate_podcast_script(self):
        """测试播客脚本生成功能"""
        # 生成播客脚本
        script = self.generator.generate_single_podcast_script(self.test_content)
        
        # 验证生成的内容
        self.assertIsNotNone(script, "生成的脚本不应为空")
        self.assertIsInstance(script, str, "生成的播客脚本应为字符串")
        self.assertGreater(len(script), 0, "生成的播客脚本不应为空")
        
        # 打印生成的脚本（用于人工检查）
        print("\n生成的播客脚本：")
        print("-" * 50)
        print(script)
        print("-" * 50)

if __name__ == '__main__':
    unittest.main() 