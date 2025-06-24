import React from 'react';
import { Form, Input, Select, Radio, Row, Col, Card } from 'antd';

const { Option } = Select;

function PodcastSettings({
  values,
  onChange
}) {
  // values: { podcastTitle, nextEpisodePreview, language, mode, role1Name, role1Style, roleAName, roleAStyle, roleBName, roleBStyle }
  // onChange: (newValues) => void

  return (
    <Card title="播客参数设置" style={{ marginBottom: 24 }}>
      <Form layout="vertical">
        <Row gutter={24}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="播客名称">
              <Input
                value={values.podcastTitle}
                onChange={e => onChange({ ...values, podcastTitle: e.target.value })}
                placeholder="请输入播客名称（选填）"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="下期预告">
              <Input
                value={values.nextEpisodePreview}
                onChange={e => onChange({ ...values, nextEpisodePreview: e.target.value })}
                placeholder="请输入下期节目预告（选填）"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="脚本长度">
              <Select
                value={values.scriptLength}
                onChange={val => onChange({ ...values, scriptLength: val })}
              >
                <Option value="short">简短 (约300-500字，核心要点)</Option>
                <Option value="medium">中等 (约800-1200字，标准内容)</Option>
                <Option value="long">详细 (约2000-3000字，深度分析)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="脚本语种">
              <Select
                value={values.language}
                onChange={val => onChange({ ...values, language: val })}
              >
                <Option value="zh">中文</Option>
                <Option value="en">英文</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="播客模式">
              <Radio.Group
                value={values.mode}
                onChange={e => onChange({ ...values, mode: e.target.value })}
              >
                <Radio value="single">单人模式</Radio>
                <Radio value="double">双人模式</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        {values.mode === 'single' ? (
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="角色名称">
                <Input
                  value={values.role1Name}
                  onChange={e => onChange({ ...values, role1Name: e.target.value })}
                  placeholder="请输入角色名称（选填）"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="语音风格">
                <Select
                  value={values.role1Style}
                  onChange={val => onChange({ ...values, role1Style: val })}
                >
                  {values.language === 'en' ? (
                    <>
                      <Option value="mild">Mild</Option>
                      <Option value="professional">Professional</Option>
                      <Option value="lively">Lively</Option>
                    </>
                  ) : (
                    <>
                      <Option value="温和">温和</Option>
                      <Option value="专业">专业</Option>
                      <Option value="活泼">活泼</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        ) : (
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="角色A名称" extra="选填：可为空，AI会用默认名">
                <Input
                  value={values.roleAName}
                  onChange={e => onChange({ ...values, roleAName: e.target.value })}
                  placeholder="角色A（选填）"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="角色A风格" extra="选填：不填则用默认风格">
                <Select
                  value={values.roleAStyle}
                  onChange={val => onChange({ ...values, roleAStyle: val })}
                  placeholder="风格（选填）"
                >
                  {values.language === 'en' ? (
                    <>
                      <Option value="mild">Mild</Option>
                      <Option value="professional">Professional</Option>
                      <Option value="lively">Lively</Option>
                    </>
                  ) : (
                    <>
                      <Option value="温和">温和</Option>
                      <Option value="专业">专业</Option>
                      <Option value="活泼">活泼</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="角色B名称" extra="选填：可为空，AI会用默认名">
                <Input
                  value={values.roleBName}
                  onChange={e => onChange({ ...values, roleBName: e.target.value })}
                  placeholder="角色B（选填）"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="角色B风格" extra="选填：不填则用默认风格">
                <Select
                  value={values.roleBStyle}
                  onChange={val => onChange({ ...values, roleBStyle: val })}
                  placeholder="风格（选填）"
                >
                  {values.language === 'en' ? (
                    <>
                      <Option value="mild">Mild</Option>
                      <Option value="professional">Professional</Option>
                      <Option value="lively">Lively</Option>
                    </>
                  ) : (
                    <>
                      <Option value="温和">温和</Option>
                      <Option value="专业">专业</Option>
                      <Option value="活泼">活泼</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Card>
  );
}

export default PodcastSettings; 