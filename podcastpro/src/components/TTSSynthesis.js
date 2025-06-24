import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, Slider, Button, Space, Row, Col, Typography, Progress, message, Divider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, DownloadOutlined, SoundOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text, Title } = Typography;

function TTSSynthesis({
  script,
  mode,
  roleAName,
  roleBName,
  loading,
  audioUrl,
  audioBlob,
  onSynthesisComplete,
  ttsParams,
  onTtsParamsChange
}) {
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voiceOptions, setVoiceOptions] = useState([]);

  // 从props解构出参数，方便使用
  const { single: singleParams, double: doubleParams } = ttsParams;

  // 自定义播放器状态
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/available_voices');
        const data = await response.json();
        if (data.voices && Array.isArray(data.voices)) {
          setVoiceOptions(data.voices);
          if (data.voices.length > 0) {
            // 使用父组件的更新函数来设置默认音色，且只在当前值为空时设置
            onTtsParamsChange(prev => ({
              single: {
                ...prev.single,
                voice: prev.single.voice || data.voices[0].value,
              },
              double: {
                roleA: { ...prev.double.roleA, voice: prev.double.roleA.voice || data.voices[0].value },
                roleB: { ...prev.double.roleB, voice: prev.double.roleB.voice || (data.voices[1]?.value || data.voices[0].value) }
              }
            }));
          }
        }
      } catch (error) {
        message.error(error.message);
        // 保留一个默认的基础选项以防接口失败
        setVoiceOptions([
          { value: 'male-qn-qingse', label: '青涩男声 (默认)' },
        ]);
      }
    };
    fetchVoices();
  }, [onTtsParamsChange]); // 依赖中加入onTtsParamsChange

  // 情感选项
  const emotionOptions = [
    { value: 'happy', label: '高兴' },
    { value: 'sad', label: '悲伤' },
    { value: 'angry', label: '愤怒' },
    { value: 'fearful', label: '害怕' },
    { value: 'disgusted', label: '厌恶' },
    { value: 'surprised', label: '惊讶' },
    { value: 'neutral', label: '中性' }
  ];

  // 播放器事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };
      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const handleEnd = () => setIsPlaying(false);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleEnd);

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', handleEnd);
      };
    }
  }, [audioUrl]); // 当 audioUrl 变化时，重新绑定事件

  // 格式化时间
  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  // 播放/暂停控制
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // 进度条拖动控制
  const handleProgressChange = (value) => {
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  // 处理语音合成
  const handleSynthesis = async () => {
    if (!script) {
      message.error('请先生成播客脚本');
      return;
    }

    setSynthesisLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('text', script);
      formData.append('mode', mode);
      formData.append('language', 'zh');

      if (mode === 'single') {
        formData.append('voice', singleParams.voice);
        formData.append('speed', singleParams.speed);
        formData.append('volume', singleParams.volume);
        formData.append('pitch', singleParams.pitch);
        formData.append('emotion', singleParams.emotion);
      } else {
        // 兜底：如果未填写角色名，自动用"角色A/角色B"
        const safeRoleAName = roleAName || '角色A';
        const safeRoleBName = roleBName || '角色B';
        formData.append('roleAName', safeRoleAName);
        formData.append('roleBName', safeRoleBName);
        formData.append('roleAVoice', doubleParams.roleA.voice);
        formData.append('roleBVoice', doubleParams.roleB.voice);
        formData.append('speedA', doubleParams.roleA.speed);
        formData.append('volumeA', doubleParams.roleA.volume);
        formData.append('pitchA', doubleParams.roleA.pitch);
        formData.append('emotionA', doubleParams.roleA.emotion);
        formData.append('speedB', doubleParams.roleB.speed);
        formData.append('volumeB', doubleParams.roleB.volume);
        formData.append('pitchB', doubleParams.roleB.pitch);
        formData.append('emotionB', doubleParams.roleB.emotion);
      }

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/generate_audio', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAudioBlob = await response.blob();
      const newAudioUrl = URL.createObjectURL(newAudioBlob);
      
      onSynthesisComplete(newAudioUrl, newAudioBlob);
      setProgress(100);
      message.success('语音合成完成！');

    } catch (error) {
      console.error('TTS合成失败:', error);
      message.error('语音合成失败: ' + error.message);
      setProgress(0);
    } finally {
      setSynthesisLoading(false);
    }
  };

  // 下载音频
  const handleDownload = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '播客音频.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 单人模式参数设置组件
  const SingleModeSettings = () => (
    <Card title="角色声音设置" size="small">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div>
            <Text strong>音色：</Text>
            <Select
              value={singleParams.voice}
              onChange={(value) => onTtsParamsChange(prev => ({ ...prev, single: { ...prev.single, voice: value } }))}
              style={{ width: '100%', marginTop: 8 }}
            >
              {voiceOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col span={12}>
          <div>
            <Text strong>情感：</Text>
            <Select
              value={singleParams.emotion}
              onChange={(value) => onTtsParamsChange(prev => ({ ...prev, single: { ...prev.single, emotion: value } }))}
              style={{ width: '100%', marginTop: 8 }}
            >
              {emotionOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col span={8}>
          <div>
            <Text strong>语速：{singleParams.speed}</Text>
            <Slider
              min={0.5}
              max={2.0}
              step={0.01}
              value={singleParams.speed}
              onChange={(value) => onTtsParamsChange(prev => ({ ...prev, single: { ...prev.single, speed: value } }))}
              style={{ marginTop: 8 }}
            />
          </div>
        </Col>
        <Col span={8}>
          <div>
            <Text strong>音量：{singleParams.volume}</Text>
            <Slider
              min={0.5}
              max={2.0}
              step={0.01}
              value={singleParams.volume}
              onChange={(value) => onTtsParamsChange(prev => ({ ...prev, single: { ...prev.single, volume: value } }))}
              style={{ marginTop: 8 }}
            />
          </div>
        </Col>
        <Col span={8}>
          <div>
            <Text strong>音调：{singleParams.pitch}</Text>
            <Slider
              min={-12}
              max={12}
              step={1}
              value={singleParams.pitch}
              onChange={(value) => onTtsParamsChange(prev => ({ ...prev, single: { ...prev.single, pitch: value } }))}
              style={{ marginTop: 8 }}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );

  // 双人模式参数设置组件
  const DoubleModeSettings = () => (
    <Row gutter={24}>
      <Col span={12}>
        <Card title={`${roleAName || '角色A'}声音设置`} size="small">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div>
                <Text strong>音色：</Text>
                <Select
                  value={doubleParams.roleA.voice}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleA: { ...prev.double.roleA, voice: value } }
                  }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {voiceOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={24}>
              <div>
                <Text strong>情感：</Text>
                <Select
                  value={doubleParams.roleA.emotion}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleA: { ...prev.double.roleA, emotion: value } }
                  }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {emotionOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>语速：{doubleParams.roleA.speed}</Text>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  value={doubleParams.roleA.speed}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleA: { ...prev.double.roleA, speed: value } }
                  }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>音量：{doubleParams.roleA.volume}</Text>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  value={doubleParams.roleA.volume}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleA: { ...prev.double.roleA, volume: value } }
                  }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>音调：{doubleParams.roleA.pitch}</Text>
                <Slider
                  min={-12}
                  max={12}
                  step={1}
                  value={doubleParams.roleA.pitch}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleA: { ...prev.double.roleA, pitch: value } }
                  }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={12}>
        <Card title={`${roleBName || '角色B'}声音设置`} size="small">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div>
                <Text strong>音色：</Text>
                <Select
                  value={doubleParams.roleB.voice}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleB: { ...prev.double.roleB, voice: value } }
                  }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {voiceOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={24}>
              <div>
                <Text strong>情感：</Text>
                <Select
                  value={doubleParams.roleB.emotion}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleB: { ...prev.double.roleB, emotion: value } }
                  }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {emotionOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>语速：{doubleParams.roleB.speed}</Text>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  value={doubleParams.roleB.speed}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleB: { ...prev.double.roleB, speed: value } }
                  }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>音量：{doubleParams.roleB.volume}</Text>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  value={doubleParams.roleB.volume}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleB: { ...prev.double.roleB, volume: value } }
                  }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>音调：{doubleParams.roleB.pitch}</Text>
                <Slider
                  min={-12}
                  max={12}
                  step={1}
                  value={doubleParams.roleB.pitch}
                  onChange={(value) => onTtsParamsChange(prev => ({
                    ...prev,
                    double: { ...prev.double, roleB: { ...prev.double.roleB, pitch: value } }
                  }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );

  return (
    <Card title="语音合成" style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 参数设置区域 */}
        {mode === 'single' ? <SingleModeSettings /> : <DoubleModeSettings />}

        <Divider />

        {/* 合成控制区域 */}
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<SoundOutlined />}
            onClick={handleSynthesis}
            loading={synthesisLoading}
            disabled={!script}
          >
            开始语音合成
          </Button>
        </div>

        {/* 进度显示 */}
        {synthesisLoading && (
          <div>
            <Progress percent={progress} status="active" />
            <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
              正在合成语音...
            </Text>
          </div>
        )}

        {/* 音频播放器 */}
        {audioUrl && (
          <Card title="合成结果" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 隐藏的audio元素，用于实际播放 */}
              <audio ref={audioRef} src={audioUrl} />
              
              {/* 自定义播放器UI */}
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Button
                  shape="circle"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlayPause}
                  size="large"
                />
                <Text style={{ marginLeft: 16, width: 100 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
                <Slider
                  style={{ flex: 1, margin: '0 16px' }}
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleProgressChange}
                  step={0.01}
                  tooltip={{ formatter: formatTime }}
                />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  type="default"
                >
                  下载音频
                </Button>
              </div>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
}

export default TTSSynthesis; 