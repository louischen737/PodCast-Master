import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Space, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

function ScriptEditor({
  script, // AI生成的脚本，JSON数组 [{role, text}, ...]
  onChange // 编辑后回传最新脚本数组
}) {
  const [lines, setLines] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  // 只根据当前脚本内容动态生成角色选项
  useEffect(() => {
    let arr = [];
    if (typeof script === 'string') {
      try {
        arr = JSON.parse(script);
      } catch {
        arr = [];
      }
    } else if (Array.isArray(script)) {
      arr = script;
    }
    // 提取所有出现过的角色名，去重
    const uniqueRoles = Array.from(new Set(arr.map(line => line.role).filter(Boolean)));
    const opts = uniqueRoles.map(r => ({ value: r, label: r }));
    setRoleOptions(opts);
    setLines(arr);
  }, [script]);

  const handleRoleChange = (idx, newRole) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[idx] = { ...newLines[idx], role: newRole };
      if (onChange) onChange(newLines);
      return newLines;
    });
  };

  const handleTextChange = (idx, newText) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[idx] = { ...newLines[idx], text: newText };
      if (onChange) onChange(newLines);
      return newLines;
    });
  };

  const handleDelete = (idx) => {
    setLines(prev => {
      if (prev.length === 1) {
        message.warning('至少保留一段台词');
        return prev;
      }
      const newLines = prev.filter((_, i) => i !== idx);
      if (onChange) onChange(newLines);
      return newLines;
    });
  };

  const handleInsert = (idx) => {
    setLines(prev => {
      const newLines = [...prev];
      const defaultRole = roleOptions.length > 0 ? roleOptions[0].value : '';
      newLines.splice(idx + 1, 0, { role: defaultRole, text: '' });
      if (onChange) onChange(newLines);
      return newLines;
    });
  };

  return (
    <Card title="脚本分段编辑" style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {lines.length === 0 && <Text type="secondary">暂无脚本内容</Text>}
        {lines.map((line, idx) => (
          <div
            key={`line-${idx}`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: 16
            }}
          >
            {roleOptions.length > 0 ? (
              <Select
                value={
                  roleOptions.find(r => r.value === line.role)
                    ? line.role
                    : roleOptions[0].value
                }
                style={{ width: 120, flexShrink: 0 }}
                onChange={val => handleRoleChange(idx, val)}
                options={roleOptions}
                placeholder="选择角色"
                // 单人模式下可根据lines所有role是否唯一来禁用
                disabled={roleOptions.length === 1}
              />
            ) : (
              <Select
                value=""
                style={{ width: 120, flexShrink: 0 }}
                options={[]}
                placeholder="请先生成脚本"
                disabled
              />
            )}
            <Input.TextArea
              value={line.text || ''}
              onChange={e => handleTextChange(idx, e.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1, margin: '0 8px' }}
              placeholder="请输入台词内容"
            />
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleInsert(idx)}
              type="dashed"
              title="在下方插入段落"
              style={{ flexShrink: 0, marginRight: 4 }}
            />
            <Popconfirm
              title="确定要删除这段台词吗？"
              onConfirm={() => handleDelete(idx)}
              okText="删除"
              cancelText="取消"
              disabled={lines.length === 1}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                disabled={lines.length === 1}
                title="删除本段"
                style={{ flexShrink: 0 }}
              />
            </Popconfirm>
          </div>
        ))}
      </Space>
    </Card>
  );
}

export default ScriptEditor; 