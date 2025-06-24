import React, { useState } from 'react';
import { Layout, Typography, Steps, Card, message } from 'antd';
import { CustomerServiceOutlined, FileTextOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons';
import ContentUpload from './components/ContentUpload';
import PodcastSettings from './components/PodcastSettings';
import ScriptGenerator from './components/ScriptGenerator';
import TTSSynthesis from './components/TTSSynthesis';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// 辅助函数：安全获取提取内容的字符串
function getExtractedText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object') {
    if (typeof content.text === 'string') return content.text;
    if (typeof content.content === 'string') return content.content;
    // 兼容数组
    if (Array.isArray(content) && content.length > 0) {
      return getExtractedText(content[0]);
    }
    // 兜底：对象转字符串
    return JSON.stringify(content);
  }
  return '';
}

function App() {
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(0);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 提取的内容
  const [extractedContent, setExtractedContent] = useState('');
  
  // 生成的脚本
  const [script, setScript] = useState('');
  
  // 播客设置参数
  const [podcastSettings, setPodcastSettings] = useState({
    podcastTitle: '',
    nextEpisodePreview: '',
    language: 'zh',
    mode: 'single',
    scriptLength: 'medium',
    role1Name: '',
    role1Style: '专业',
    roleAName: '',
    roleAStyle: '温和',
    roleBName: '',
    roleBStyle: '温和'
  });

  // 生成的音频数据
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);

  // TTS参数状态
  const [ttsParams, setTtsParams] = useState({
    single: {
      voice: '', // 初始化为空，防止闪烁
      speed: 1.0,
      volume: 1.0,
      pitch: 0,
      emotion: 'neutral'
    },
    double: {
      roleA: {
        voice: '', // 初始化为空
        speed: 1.0,
        volume: 1.0,
        pitch: 0,
        emotion: 'neutral'
      },
      roleB: {
        voice: '', // 初始化为空
        speed: 1.0,
        volume: 1.0,
        pitch: 0,
        emotion: 'neutral'
      }
    }
  });

  // 步骤配置
  const steps = [
    {
      title: '上传内容',
      icon: <UploadOutlined />,
      description: '上传文件或输入URL'
    },
    {
      title: '参数设置',
      icon: <SettingOutlined />,
      description: '配置播客参数'
    },
    {
      title: '生成脚本',
      icon: <FileTextOutlined />,
      description: 'AI生成播客脚本'
    },
    {
      title: '语音合成',
      icon: <CustomerServiceOutlined />,
      description: 'TTS语音合成'
    }
  ];

  // 处理内容提取完成
  const handleContentExtracted = (content) => {
    console.log('内容提取完成:', content);
    console.log('getExtractedText:', getExtractedText(content));
    setExtractedContent(content);
    message.success('内容提取成功！');
  };

  // 处理脚本生成
  const handleGenerateScript = async () => {
    if (!extractedContent) {
      message.error('请先上传并提取内容');
      return;
    }

    setLoading(true);
    try {
      // 组装payload为JSON
      const payload = {
        content: extractedContent,
        podcast_title: podcastSettings.podcastTitle,
        next_episode_preview: podcastSettings.nextEpisodePreview,
        podcast_mode: podcastSettings.mode,
        language: podcastSettings.language,
        scriptLength: podcastSettings.scriptLength,
      };
      if (podcastSettings.mode === 'single') {
        payload.role1_name = podcastSettings.role1Name;
        payload.role1_style = podcastSettings.role1Style;
      } else {
        payload.roleA_name = podcastSettings.roleAName;
        payload.roleA_style = podcastSettings.roleAStyle;
        payload.roleB_name = podcastSettings.roleBName;
        payload.roleB_style = podcastSettings.roleBStyle;
      }
      const response = await fetch('/api/generate_podcast_script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      setScript(result.podcast_script);
      message.success('播客脚本生成成功！');
    } catch (error) {
      console.error('脚本生成失败:', error);
      message.error('脚本生成失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理脚本复制
  const handleCopyScript = () => {
    if (!script) {
      message.error('没有可复制的脚本');
      return;
    }

    navigator.clipboard.writeText(script).then(() => {
      message.success('脚本已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 处理脚本下载
  const handleDownloadScript = () => {
    if (!script) {
      message.error('没有可下载的脚本');
      return;
    }

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '播客脚本.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('脚本下载成功');
  };

  // 处理语音合成完成
  const handleSynthesisComplete = (url, blob) => {
    setAudioUrl(url);
    setAudioBlob(blob);
  };

  // 下一步
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ContentUpload
            onContentExtracted={handleContentExtracted}
            loading={loading}
          />
        );
      case 1:
        return (
          <PodcastSettings
            values={podcastSettings}
            onChange={setPodcastSettings}
          />
        );
      case 2:
        return (
          <ScriptGenerator
            script={script}
            loading={loading}
            onGenerate={handleGenerateScript}
            onCopy={handleCopyScript}
            onDownload={handleDownloadScript}
            podcastSettings={podcastSettings}
            onScriptEdit={newScriptArr => setScript(JSON.stringify(newScriptArr))}
          />
        );
      case 3:
        return (
          <TTSSynthesis
            script={script}
            mode={podcastSettings.mode}
            roleAName={podcastSettings.roleAName}
            roleBName={podcastSettings.roleBName}
            loading={loading}
            audioUrl={audioUrl}
            audioBlob={audioBlob}
            onSynthesisComplete={handleSynthesisComplete}
            ttsParams={ttsParams}
            onTtsParamsChange={setTtsParams}
          />
        );
      default:
        return null;
    }
  };

  // 检查是否可以进入下一步
  const canGoNext = () => {
    let canGo = false;
    const extractedText = getExtractedText(extractedContent);
    console.log('canGoNext extractedText:', extractedText);
    switch (currentStep) {
      case 0:
        canGo = extractedText.trim() !== '';
        break;
      case 1:
        canGo = true;
        break;
      case 2:
        canGo = script !== '';
        break;
      case 3:
        canGo = true;
        break;
      default:
        canGo = false;
    }
    console.log(`步骤${currentStep}是否可以进入下一步:`, canGo, '内容:', extractedContent, '脚本:', script);
    return canGo;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 50px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          height: '100%',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <CustomerServiceOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            BiliStory
          </Title>
        </div>
      </Header>

      <Content style={{ 
        padding: '24px 50px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%'
      }}>
        {/* 步骤条 */}
        <Card style={{ marginBottom: 24 }}>
          <Steps
            current={currentStep}
            items={steps}
            onChange={(step) => {
              console.log('步骤跳转请求:', step, '当前内容:', extractedContent, '当前脚本:', script);
              if (step === 0) {
                setCurrentStep(0);
                return;
              }
              if (step === 1 && getExtractedText(extractedContent).trim() !== '') {
                setCurrentStep(1);
                return;
              }
              if (step === 2 && getExtractedText(extractedContent).trim() !== '') {
                setCurrentStep(2);
                return;
              }
              if (step === 3 && script && script.trim() !== '') {
                setCurrentStep(3);
                return;
              }
              if (step === 1) {
                message.warning('请先上传并提取内容');
              } else if (step === 2) {
                message.warning('请先完成参数设置');
              } else if (step === 3) {
                message.warning('请先生成播客脚本');
              }
            }}
            style={{ marginBottom: 24 }}
          />
        </Card>

        {/* 步骤内容 */}
        <Card>
          {renderStepContent()}
        </Card>

        {/* 导航按钮 */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 16
        }}>
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              style={{
                padding: '8px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              上一步
            </button>
          )}
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: canGoNext() ? '#1890ff' : '#d9d9d9',
                color: '#fff',
                cursor: canGoNext() ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              下一步
            </button>
          )}
        </div>
      </Content>

      <Footer style={{ 
        textAlign: 'center',
        background: '#f0f2f5',
        padding: '24px 50px'
      }}>
        <p style={{ margin: 0, color: '#666' }}>
          BiliStory ©2025 - Let AI create professional podcasts for you
        </p>
      </Footer>
    </Layout>
  );
}

export default App;
