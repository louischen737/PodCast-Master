import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Spin, message } from 'antd';
import ScriptEditor from './ScriptEditor';

const { Text, Paragraph } = Typography;

function ScriptGenerator({
  script,
  loading,
  onGenerate,
  onCopy,
  onDownload,
  podcastSettings,
  onScriptEdit
}) {
  // 判断script是否为JSON数组
  let scriptArr = [];
  try {
    scriptArr = typeof script === 'string' ? JSON.parse(script) : (Array.isArray(script) ? script : []);
  } catch {
    scriptArr = [];
  }

  // 动态生成角色选项
  const [roles, setRoles] = useState([]);
  
  useEffect(() => {
    if (podcastSettings) {
      let newRoles = [];
      if (podcastSettings.mode === 'single') {
        // 英文且未填写角色名时，角色为Host且不可编辑
        if (podcastSettings.language === 'en' && !podcastSettings.role1Name) {
          newRoles = [{ value: 'Host', label: 'Host', disabled: true }];
        } else {
          newRoles = [{
            value: podcastSettings.role1Name || (podcastSettings.language === 'en' ? 'Host' : '主播'),
            label: podcastSettings.role1Name || (podcastSettings.language === 'en' ? 'Host' : '主播')
          }];
        }
      } else {
        newRoles = [
          {
            value: podcastSettings.roleAName || (podcastSettings.language === 'en' ? 'HostA' : '角色A'),
            label: podcastSettings.roleAName || (podcastSettings.language === 'en' ? 'HostA' : '角色A')
          },
          {
            value: podcastSettings.roleBName || (podcastSettings.language === 'en' ? 'HostB' : '角色B'),
            label: podcastSettings.roleBName || (podcastSettings.language === 'en' ? 'HostB' : '角色B')
          }
        ];
      }
      setRoles(newRoles);
    }
  }, [podcastSettings]);

  // 新增：格式化脚本为文本
  const formatScriptText = () => {
    if (!scriptArr.length) return '';
    if (podcastSettings && podcastSettings.mode === 'single') {
      // 单人模式：只拼接所有text
      return scriptArr.map(line => line.text).join('\n\n');
    } else {
      // 双人模式：角色名：台词
      return scriptArr.map(line => `${line.role}：${line.text}`).join('\n\n');
    }
  };

  // 处理脚本复制
  const handleCopyScript = () => {
    const text = formatScriptText();
    if (!text) {
      message.error('没有可复制的脚本');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      message.success('脚本已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 处理脚本下载
  const handleDownloadScript = () => {
    const text = formatScriptText();
    if (!text) {
      message.error('没有可下载的脚本');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
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

  return (
    <Card title="播客脚本生成" style={{ marginBottom: 24, textAlign: 'center' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space size="middle" style={{ justifyContent: 'center', width: '100%' }}>
          <Button type="primary" onClick={onGenerate} loading={loading}>
            生成播客脚本
          </Button>
          <Button onClick={handleDownloadScript} disabled={!script}>
            下载脚本
          </Button>
          <Button onClick={handleCopyScript} disabled={!script}>
            复制脚本
          </Button>
        </Space>
        <div style={{ minHeight: 200, background: '#fafafa', padding: 16, borderRadius: 8, textAlign: 'left' }}>
          {loading ? (
            <Spin tip="正在生成播客脚本..." />
          ) : scriptArr.length > 0 ? (
            <ScriptEditor 
              script={scriptArr} 
              onChange={onScriptEdit} 
              roles={roles} 
            />
          ) : script ? (
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{script}</Paragraph>
          ) : (
            <Text type="secondary">请点击"生成播客脚本"按钮</Text>
          )}
        </div>
      </Space>
    </Card>
  );
}

export default ScriptGenerator; 