import React, { useState } from 'react';
import { Card, Upload, Input, Button, Space, message, Typography } from 'antd';
import { UploadOutlined, LinkOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

function ContentUpload({
  onContentExtracted,
  loading
}) {
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [fileList, setFileList] = useState([]);
  const [url, setUrl] = useState('');
  const [extractedContent, setExtractedContent] = useState('');

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    fileList,
    beforeUpload: async (file) => {
      const isValidType = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ].includes(file.type);
      
      if (!isValidType) {
        message.error('只支持 PDF、Word、TXT 格式文件！');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
        return false;
      }
      
      setFileList([file]);
      // 自动上传并提取内容
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/extract_file', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        let contentObj = result.content;
        setExtractedContent(contentObj);
        onContentExtracted(contentObj);
        let contentStr = '';
        if (typeof contentObj === 'string') {
          contentStr = contentObj;
        } else if (contentObj && typeof contentObj.text === 'string') {
          contentStr = contentObj.text;
        } else {
          contentStr = JSON.stringify(contentObj, null, 2);
        }
        message.success('文件内容提取成功！');
      } catch (error) {
        console.error('Error:', error);
        message.error('上传文件失败: ' + error.message);
      }
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setFileList([]);
      setExtractedContent('');
    }
  };

  // 处理文件上传
  const handleFileUpload = async () => {
    if (fileList.length === 0) {
      message.error('请选择文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      const response = await fetch('/api/extract_file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      let contentObj = result.content;
      setExtractedContent(contentObj);
      onContentExtracted(contentObj);
      let contentStr = '';
      if (typeof contentObj === 'string') {
        contentStr = contentObj;
      } else if (contentObj && typeof contentObj.text === 'string') {
        contentStr = contentObj.text;
      } else {
        contentStr = JSON.stringify(contentObj, null, 2);
      }
      message.success('文件内容提取成功！');
    } catch (error) {
      console.error('Error:', error);
      message.error('上传文件失败: ' + error.message);
    }
  };

  // 处理URL提取
  const handleUrlExtract = async () => {
    if (!url.trim()) {
      message.error('请输入网页URL');
      return;
    }

    const formData = new FormData();
    formData.append('url', url.trim());

    try {
      const response = await fetch('/api/extract_url', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      let contentObj = result.content;
      setExtractedContent(contentObj);
      onContentExtracted(contentObj);
      let contentStr = '';
      if (typeof contentObj === 'string') {
        contentStr = contentObj;
      } else if (contentObj && typeof contentObj.text === 'string') {
        contentStr = contentObj.text;
      } else {
        contentStr = JSON.stringify(contentObj, null, 2);
      }
      message.success('网页内容提取成功！');
    } catch (error) {
      console.error('Error:', error);
      message.error('提取URL内容失败: ' + error.message);
    }
  };

  return (
    <Card title="上传内容" style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 上传方式选择 */}
        <Space size="middle" style={{ justifyContent: 'center', width: '100%' }}>
          <Button
            type={uploadMethod === 'file' ? 'primary' : 'default'}
            icon={<UploadOutlined />}
            onClick={() => {
              setUploadMethod('file');
              // 不清空已提取的内容
            }}
          >
            本地文件
          </Button>
          <Button
            type={uploadMethod === 'url' ? 'primary' : 'default'}
            icon={<LinkOutlined />}
            onClick={() => {
              setUploadMethod('url');
              // 不清空已提取的内容
            }}
          >
            网页URL
          </Button>
        </Space>

        {/* 文件上传区域 */}
        {uploadMethod === 'file' && (
          <div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={loading}>
                选择文件
              </Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              支持 PDF、Word、TXT 格式，文件大小不超过 10MB
            </Text>
          </div>
        )}

        {/* URL输入区域 */}
        {uploadMethod === 'url' && (
          <div>
            <Input
              placeholder="请输入网页URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPressEnter={handleUrlExtract}
              style={{ marginBottom: 16 }}
            />
            <Button
              type="primary"
              onClick={handleUrlExtract}
              loading={loading}
              disabled={!url.trim()}
            >
              提取网页内容
            </Button>
          </div>
        )}

        {/* 提取结果显示 */}
        {extractedContent && (
          <div style={{ marginTop: 16 }}>
            <Text strong>提取的内容：</Text>
            <TextArea
              value={typeof extractedContent === 'string' ? extractedContent : (extractedContent && extractedContent.text ? extractedContent.text : JSON.stringify(extractedContent, null, 2))}
              rows={6}
              readOnly
              style={{ marginTop: 8 }}
            />
          </div>
        )}
      </Space>
    </Card>
  );
}

export default ContentUpload; 