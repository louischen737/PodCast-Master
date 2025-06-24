console.log('main.js loaded - very top');

document.addEventListener('DOMContentLoaded', async function() {
    console.log('main.js DOMContentLoaded fired');
    // 获取DOM元素
    const methodBtns = document.querySelectorAll('.method-btn');
    const fileInputArea = document.getElementById('file-input-area');
    const urlInputArea = document.getElementById('url-input-area');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileName = document.getElementById('file-name');
    const urlInput = document.getElementById('url-input');
    const extractBtn = document.getElementById('extract-btn');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const podcastScript = document.getElementById('podcast_script');
    const copyScriptBtn = document.getElementById('copy_script');
    const downloadScriptBtn = document.getElementById('download_script');
    // 新增：获取编辑相关按钮
    const editBtn = document.getElementById('edit_script');
    const saveEditBtn = document.getElementById('save_script');

    // 新增：获取播客设置的DOM元素
    const podcastTitleInput = document.getElementById('podcast-title-input');
    console.log('podcastTitleInput:', podcastTitleInput); // Debug log
    const podcastHostInput = document.getElementById('podcast_host');
    console.log('podcastHostInput:', podcastHostInput); // Debug log
    const nextEpisodePreviewInput = document.getElementById('next_episode_preview');
    console.log('nextEpisodePreviewInput:', nextEpisodePreviewInput); // Debug log

    // 语音合成相关元素
    const ttsSection = document.getElementById('tts-section');
    const voiceSelect = document.getElementById('voice-select');
    const speedSlider = document.getElementById('speed-slider');
    const volumeSlider = document.getElementById('volume-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const speedValue = document.getElementById('speed-value');
    const volumeValue = document.getElementById('volume-value');
    const pitchValue = document.getElementById('pitch-value');
    const synthesizeBtn = document.getElementById('synthesize-btn');
    const synthesisProgress = document.getElementById('synthesis-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const audioPlayer = document.getElementById('audio-player');
    const audioElement = document.getElementById('audio-element');
    const downloadAudioBtn = document.getElementById('download-audio');
    const regenerateAudioBtn = document.getElementById('regenerate-audio');
    const historySection = document.getElementById('history-section');
    const taskList = document.getElementById('task-list');

    // 新增：单人/双人模式切换逻辑
    const modeSingle = document.getElementById('mode-single');
    const modeDouble = document.getElementById('mode-double');
    const roleSettingsSingle = document.getElementById('role-settings-single');
    const roleSettingsDouble = document.getElementById('role-settings-double');

    // 新增：语音参数区模式切换显示逻辑
    const ttsSettingsSingle = document.getElementById('tts-settings-single');
    const ttsSettingsDouble = document.getElementById('tts-settings-double');

    function updateRoleSettingsDisplay() {
        if (modeSingle.checked) {
            roleSettingsSingle.style.display = 'block';
            roleSettingsDouble.style.display = 'none';
        } else {
            roleSettingsSingle.style.display = 'none';
            roleSettingsDouble.style.display = 'block';
        }
    }
    modeSingle.addEventListener('change', updateRoleSettingsDisplay);
    modeDouble.addEventListener('change', updateRoleSettingsDisplay);
    // 初始化
    updateRoleSettingsDisplay();

    function updateTTSSettingsDisplay() {
        if (modeSingle.checked) {
            ttsSettingsSingle.style.display = 'block';
            ttsSettingsDouble.style.display = 'none';
        } else {
            ttsSettingsSingle.style.display = 'none';
            ttsSettingsDouble.style.display = 'flex';
        }
    }
    modeSingle.addEventListener('change', updateTTSSettingsDisplay);
    modeDouble.addEventListener('change', updateTTSSettingsDisplay);
    // 初始化
    updateTTSSettingsDisplay();

    // 新增：滑块值显示联动
    function bindSlider(sliderId, valueId) {
        const slider = document.getElementById(sliderId);
        const value = document.getElementById(valueId);
        if (slider && value) {
            slider.addEventListener('input', () => {
                value.textContent = slider.value;
            });
        }
    }
    // 单人
    bindSlider('speed-single', 'speed-value-single');
    bindSlider('volume-single', 'volume-value-single');
    bindSlider('pitch-single', 'pitch-value-single');
    // 双人A
    bindSlider('speed-A', 'speed-value-A');
    bindSlider('volume-A', 'volume-value-A');
    bindSlider('pitch-A', 'pitch-value-A');
    // 双人B
    bindSlider('speed-B', 'speed-value-B');
    bindSlider('volume-B', 'volume-value-B');
    bindSlider('pitch-B', 'pitch-value-B');

    // 保证语音合成区域默认显示
    if (ttsSection) {
        ttsSection.style.display = 'block';
    }

    // 切换输入方式
    methodBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                console.log('Method button clicked:', btn.dataset.method);
                methodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (btn.dataset.method === 'file') {
                    if (fileInputArea) fileInputArea.style.display = 'block';
                    if (urlInputArea) urlInputArea.style.display = 'none';
                } else {
                    if (fileInputArea) fileInputArea.style.display = 'none';
                    if (urlInputArea) urlInputArea.style.display = 'block';
                }
                // 清除文件和URL输入状态
                if (fileInput) fileInput.value = '';
                if (fileName) fileName.textContent = '';
                if (urlInput) urlInput.value = '';
                if (podcastTitleInput) podcastTitleInput.value = '';
                if (podcastHostInput) podcastHostInput.value = '';
                if (resultArea) resultArea.style.display = 'none';
                if (podcastScript) podcastScript.value = '';
                if (editBtn) editBtn.style.display = 'inline-block';
                if (saveEditBtn) saveEditBtn.style.display = 'none';
            });
        }
    });

    // 文件上传区域点击事件
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => {
            console.log('Drop zone clicked, attempting to click file input.');
            fileInput.click();
            console.log('fileInput.click() executed.');
        });
    }

    // 文件选择事件
    if (fileInput && fileName) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileName.textContent = e.target.files[0].name;
                console.log('File selected:', e.target.files[0]);
            } else {
                fileName.textContent = '';
                console.log('No file selected.');
            }
        });
    }

    // 拖拽事件辅助函数
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files; 
        // 手动触发 change 事件，以便更新文件名称显示
        const changeEvent = new Event('change');
        fileInput.dispatchEvent(changeEvent);
    }

    // 绑定拖拽事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    // 更新字数统计和时长
    function updateScriptStats(text) {
        const wordCount = text.trim().length;
        const duration = Math.ceil(wordCount / 200); // 假设每分钟朗读200字
        
        document.getElementById('word_count').textContent = wordCount;
        document.getElementById('duration').textContent = duration;
    }

    // 在脚本内容更新时调用统计函数
    if (podcastScript) {
        podcastScript.addEventListener('input', function() {
            updateScriptStats(this.value);
        });
    }

    // 获取脚本JSON数组（从DOM提取）
    function getScriptJsonFromDOM() {
        const lines = document.querySelectorAll('.script-line');
        const result = [];
        lines.forEach(line => {
            let role = line.querySelector('.role-selector').textContent || '';
            role = role.split('⇄')[0].trim();
            const text = line.querySelector('.line-input').value.trim();
            if (text) {
                result.push({ role, text });
            }
        });
        return result;
    }

    // 生成播客脚本后渲染到script-editor
    async function handleGenerateScript(genData, mode, singleRoleName) {
        let arr = genData.podcast_script;
        let tryCount = 0;
        while (typeof arr === 'string' && tryCount < 3) {
            try {
                arr = JSON.parse(arr);
            } catch (e) {
                break;
            }
            tryCount++;
        }
        if (!Array.isArray(arr)) {
            arr = [];
        }
        renderScriptEditorFromJson(arr, mode, singleRoleName);
        window.lastScriptJson = arr;
        updateScriptStats(arr.map(item => item.text || '').join('\n'));
    }

    // 生成播客脚本
    extractBtn.addEventListener('click', async () => {
        const activeMethod = document.querySelector('.method-btn.active').dataset.method;
        let formData = new FormData();

        if (activeMethod === 'file') {
            if (!fileInput.files.length) {
                alert('请选择文件');
                return;
            }
            formData.append('file', fileInput.files[0]);
        } else {
            const url = urlInput.value.trim();
            if (!url) {
                alert('请输入URL');
                return;
            }
            formData.append('url', url);
        }

        // 新增：添加单人/双人模式和角色参数到FormData
        const podcastMode = modeSingle.checked ? 'single' : 'double';
        formData.append('podcast_mode', podcastMode);
        if (podcastMode === 'single') {
            formData.append('role1_name', (document.getElementById('role1-name')?.value || '').trim());
            formData.append('role1_style', (document.getElementById('role1-style')?.value || '').trim());
        } else {
            formData.append('roleA_name', (document.getElementById('roleA-name')?.value || '').trim());
            formData.append('roleA_style', (document.getElementById('roleA-style')?.value || '').trim());
            formData.append('roleB_name', (document.getElementById('roleB-name')?.value || '').trim());
            formData.append('roleB_style', (document.getElementById('roleB-style')?.value || '').trim());
        }

        // 保持原有播客名称、下期预告
        const podcastTitle = podcastTitleInput ? podcastTitleInput.value.trim() : '';
        const nextEpisodePreview = nextEpisodePreviewInput ? nextEpisodePreviewInput.value.trim() : '';
        if (podcastTitle) {
            formData.append('podcast_title', podcastTitle);
        }
        if (nextEpisodePreview) {
            formData.append('next_episode_preview', nextEpisodePreview);
        }

        // 新增：添加语言参数到FormData
        const languageSelect = document.getElementById('language-select');
        const language = languageSelect ? languageSelect.value : 'zh';
        formData.append('language', language);

        // 显示加载动画
        loading.style.display = 'block';
        if (podcastScript) podcastScript.value = '';

        try {
            // 第一步：内容提取
            const extractResp = await fetch('/api/extract', {
                method: 'POST',
                body: formData
            });
            const extractData = await extractResp.json();
            if (!extractData.success || !extractData.content) {
                alert('内容提取失败');
                return;
            }

            // 第二步：生成脚本
            // 这里改为用 JSON 格式提交，并包含 role1_name
            const genPayload = {
                content: extractData.content,
                podcast_title: podcastTitle,
                next_episode_preview: nextEpisodePreview,
                podcast_mode: podcastMode,
                role1_name: (document.getElementById('role1-name')?.value || '').trim(),
                role1_style: (document.getElementById('role1-style')?.value || '').trim(),
                language: language,
            };
            if (podcastMode === 'double') {
                genPayload.roleA_name = (document.getElementById('roleA-name')?.value || '').trim();
                genPayload.roleA_style = (document.getElementById('roleA-style')?.value || '').trim();
                genPayload.roleB_name = (document.getElementById('roleB-name')?.value || '').trim();
                genPayload.roleB_style = (document.getElementById('roleB-style')?.value || '').trim();
                // 预设分工
                if (language === 'en') {
                    genPayload.roleA_duty = 'You are the narrator in the conversation, responsible for leading the topic, asking key questions, and summarizing.';
                    genPayload.roleA_style = 'mild';
                    genPayload.roleB_duty = 'You are the responder in the conversation, mainly responding to the narrator\'s topics, sharing your insights and examples.';
                    genPayload.roleB_style = 'mild';
                } else {
                    genPayload.roleA_duty = '你是对话中的讲述者，负责梳理话题脉络，提出核心问题，推动对话进展，并适时总结讨论内容。你善于引导和串联，让对话结构清晰、内容连贯。';
                    genPayload.roleB_duty = '你是对话中的回应者，主要围绕讲述者提出的话题进行深入回应，分享你的见解、经验和思考。你能够补充信息，举例说明，适时回应讲述者的观点，使对话内容更丰富和有深度。';
                }
            } else {
                // 如果用户输入了英文名，则用用户输入，否则用默认
                const userInput = (document.getElementById('role1-name')?.value || '').trim();
                genPayload.role1_name = userInput || 'Narrator';
                genPayload.role1_style = 'mild';
            }
            console.log('生成脚本请求payload:', genPayload);
            const genResp = await fetch('/api/generate_podcast_script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(genPayload)
            });
            const genData = await genResp.json();
            if (genData.podcast_script) {
                handleGenerateScript(genData, podcastMode, (document.getElementById('role1-name')?.value || '').trim());
            } else {
                alert('未生成播客脚本');
            }
        } catch (error) {
            alert('生成播客脚本失败: ' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    });

    // 复制脚本按钮
    copyScriptBtn.addEventListener('click', () => {
        const arr = getScriptJsonFromDOM();
        const text = arr.map(item => item.text || '').join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('脚本已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        });
    });

    // 下载脚本按钮
    downloadScriptBtn.addEventListener('click', () => {
        const arr = getScriptJsonFromDOM();
        const text = arr.map(item => item.text || '').join('\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '播客脚本.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 语音合成按钮
    synthesizeBtn.addEventListener('click', async () => {
        let textForTTS = JSON.stringify(getScriptJsonFromDOM());
        if (!textForTTS || textForTTS === '[]') {
            alert('请先生成播客脚本');
            return;
        }
        // 新增：收集角色语音参数
        let ttsParams = {};
        if (modeSingle.checked) {
            const voiceSingle = document.getElementById('voice-single');
            if (!voiceSingle) {
                alert('未找到单人模式音色下拉框，请检查页面元素！');
                return;
            }
            ttsParams = {
                mode: 'single',
                voice: voiceSingle.value,
                speed: document.getElementById('speed-single').value,
                volume: document.getElementById('volume-single').value,
                pitch: document.getElementById('pitch-single').value,
                emotion: document.getElementById('emotion-single').value
            };
        } else {
            const voiceA = document.getElementById('voice-A');
            const voiceB = document.getElementById('voice-B');
            if (!voiceA || !voiceB) {
                alert('未找到双人模式音色下拉框，请检查页面元素！');
                return;
            }
            const roleAName = document.getElementById('roleA-name').value.trim();
            const roleBName = document.getElementById('roleB-name').value.trim();
            if (!roleAName || !roleBName) {
                alert('请填写角色A和角色B的名称');
                return;
            }
            ttsParams = {
                mode: 'double',
                roleA_name: roleAName,
                roleB_name: roleBName,
                voiceA: voiceA.value,
                speedA: document.getElementById('speed-A').value,
                volumeA: document.getElementById('volume-A').value,
                pitchA: document.getElementById('pitch-A').value,
                emotionA: document.getElementById('emotion-A').value,
                voiceB: voiceB.value,
                speedB: document.getElementById('speed-B').value,
                volumeB: document.getElementById('volume-B').value,
                pitchB: document.getElementById('pitch-B').value,
                emotionB: document.getElementById('emotion-B').value
            };
        }
        // 新增：添加语言参数到FormData
        const languageSelect = document.getElementById('language-select');
        const language = languageSelect ? languageSelect.value : 'zh';
        // 组装FormData
        const formData = new FormData();
        if (modeSingle.checked) {
            formData.append('mode', 'single');
            formData.append('voice', ttsParams.voice);
            formData.append('speed', ttsParams.speed);
            formData.append('volume', ttsParams.volume);
            formData.append('pitch', ttsParams.pitch);
            formData.append('emotion', ttsParams.emotion);
            formData.append('text', textForTTS);
            formData.append('language', language);
        } else {
            formData.append('mode', 'double');
            formData.append('roleAName', ttsParams.roleA_name);
            formData.append('roleBName', ttsParams.roleB_name);
            formData.append('roleAVoice', ttsParams.voiceA);
            formData.append('roleBVoice', ttsParams.voiceB);
            formData.append('speedA', ttsParams.speedA);
            formData.append('volumeA', ttsParams.volumeA);
            formData.append('pitchA', ttsParams.pitchA);
            formData.append('emotionA', ttsParams.emotionA);
            formData.append('speedB', ttsParams.speedB);
            formData.append('volumeB', ttsParams.volumeB);
            formData.append('pitchB', ttsParams.pitchB);
            formData.append('emotionB', ttsParams.emotionB);
            formData.append('text', textForTTS);
            formData.append('language', language);
        }
        // 显示进度条等原有逻辑
        synthesisProgress.style.display = 'block';
        audioPlayer.style.display = 'none';
        synthesizeBtn.disabled = true;
        progressFill.style.width = '0%';
        progressText.textContent = '正在合成...';
        try {
            const response = await fetch('/api/generate_audio', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '语音合成接口请求失败');
            }
            const audioBlob = await response.blob();
            console.log("音频数据大小（字节）：", audioBlob.size);
            const audioUrl = URL.createObjectURL(audioBlob);
            audioElement.src = audioUrl;
            audioPlayer.style.display = 'block';
            progressFill.style.width = '100%';
            progressText.textContent = '合成完成！';

            // 新增：后端收到text参数后打印前200字符
            const text = textForTTS.trim();
            console.log("收到text参数：", text.slice(0, 200));
        } catch (error) {
            alert('语音合成失败: ' + error.message);
            progressText.textContent = '合成失败';
        } finally {
            synthesizeBtn.disabled = false;
        }
    });

    // 下载音频
    if (downloadAudioBtn) {
        downloadAudioBtn.addEventListener('click', () => {
            const audioUrl = audioElement.src;
            if (audioUrl) {
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = '播客音频.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    // 重新生成音频
    if (regenerateAudioBtn && synthesizeBtn) {
        regenerateAudioBtn.addEventListener('click', () => {
            synthesizeBtn.click();
        });
    }

    // 加载历史任务列表
    async function loadTaskHistory() {
        try {
            const response = await fetch('/api/task_list');
            const result = await response.json();
            
            if (result.tasks && result.tasks.length > 0) {
                historySection.style.display = 'block';
                taskList.innerHTML = '';
                
                result.tasks.forEach(task => {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'task-item';
                    
                    const statusClass = task.status === 'completed' ? 'completed' : 
                                      task.status === 'failed' ? 'failed' : 'processing';
                    
                    taskElement.innerHTML = `
                        <div class="task-header">
                            <span class="task-status ${statusClass}">${getStatusText(task.status)}</span>
                            <span class="task-time">${formatTime(task.created_at)}</span>
                        </div>
                        <div class="task-text">${task.text_preview}</div>
                        <div class="task-meta">
                            <span>音色: ${getVoiceName(task.voice_id)}</span>
                            ${task.duration ? `<span>时长: ${task.duration}秒</span>` : ''}
                        </div>
                        ${task.audio_url ? `
                            <div class="task-actions">
                                <button class="btn btn-primary" onclick="playAudio('${task.audio_url}')">播放</button>
                                <button class="btn btn-secondary" onclick="downloadAudio('${task.audio_url}')">下载</button>
                            </div>
                        ` : ''}
                    `;
                    
                    taskList.appendChild(taskElement);
                });
            } else {
                historySection.style.display = 'none';
            }
        } catch (error) {
            console.error('加载历史任务失败:', error);
        }
    }

    // 获取状态文本
    function getStatusText(status) {
        const statusMap = {
            'processing': '处理中',
            'completed': '已完成',
            'failed': '失败'
        };
        return statusMap[status] || status;
    }

    // 格式化时间
    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN');
    }

    // 获取音色名称
    function getVoiceName(voiceId) {
        const voiceMap = {
            'male-qn-qingse': '青涩男声',
            'female-qn-qingse': '青涩女声',
            'male-qn-zhongxing': '中性男声',
            'female-qn-zhongxing': '中性女声'
        };
        return voiceMap[voiceId] || voiceId;
    }

    // 全局函数，供任务列表中的按钮调用
    window.playAudio = function(audioUrl) {
        audioElement.src = audioUrl;
        audioPlayer.style.display = 'block';
        audioElement.play();
    };

    window.downloadAudio = function(audioUrl) {
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = '播客音频.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // 页面加载时加载历史任务
    loadTaskHistory();

    // 动态加载音色列表并渲染到下拉框
    async function loadVoiceList() {
        try {
            const response = await fetch('/api/available_voices');
            const data = await response.json();
            const voices = data.voices || [];
            // 生成HTML
            let html = '';
            if (voices.length) {
                html += '<optgroup label="全部音色">';
                voices.forEach(v => {
                    html += `<option value="${v.voice_id}">${v.voice_name}</option>`;
                });
                html += '</optgroup>';
            } else {
                html = '<option value="">无可用音色</option>';
            }
            // 更新所有音色选择下拉框
            ['voice-single', 'voice-A', 'voice-B'].forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.innerHTML = html;
                }
            });
        } catch (e) {
            console.error('获取音色列表失败:', e);
            const errorHtml = '<option value="">获取音色失败</option>';
            ['voice-single', 'voice-A', 'voice-B'].forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.innerHTML = errorHtml;
                }
            });
        }
    }

    // 页面加载完成后调用
    loadVoiceList();

    // ===== 分步页面切换与步骤条高亮 =====
    (function() {
        let currentStep = 1;
        const totalSteps = 3;
        const stepContents = [];
        for (let i = 1; i <= totalSteps; i++) {
            stepContents[i] = document.getElementById(`step-${i}`);
        }
        const stepBarSteps = document.querySelectorAll('.step-bar .step');

        function showStep(step) {
            for (let i = 1; i <= totalSteps; i++) {
                if (stepContents[i]) stepContents[i].style.display = (i === step) ? '' : 'none';
            }
            stepBarSteps.forEach((el, idx) => {
                if (idx === step - 1) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });
            currentStep = step;
        }

        // 下一步按钮
        document.querySelectorAll('.next-step-btn').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function(e) {
                    // alert('下一步按钮已点击'); // 移除调试弹窗
                    console.log('[DEBUG] 下一步按钮点击事件触发', this, e);
                    const next = parseInt(this.getAttribute('data-next'));
                    // 步骤1->2校验：必须有上传内容
                    if (next === 2) {
                        const activeMethod = document.querySelector('.method-btn.active') ? document.querySelector('.method-btn.active').dataset.method : '';
                        console.log('activeMethod:', activeMethod);
                        console.log('fileInputArea display:', fileInputArea && fileInputArea.style.display);
                        console.log('urlInputArea display:', urlInputArea && urlInputArea.style.display);
                        console.log('fileInput.files:', fileInput && fileInput.files);
                        console.log('urlInput.value:', urlInput && urlInput.value);
                        let valid = false;
                        if (activeMethod === 'file' && (!fileInputArea || fileInputArea.style.display !== 'none')) {
                            valid = fileInput && fileInput.files && fileInput.files.length > 0;
                            if (!valid) {
                                alert('请选择文件');
                                return;
                            }
                        } else if (activeMethod === 'url' && (!urlInputArea || urlInputArea.style.display !== 'none')) {
                            valid = urlInput && urlInput.value.trim().length > 0;
                            if (!valid) {
                                alert('请输入网页URL');
                                return;
                            }
                        } else {
                            alert('请选择上传方式并填写内容');
                            return;
                        }
                    }
                    // 步骤3校验：必须有播客脚本
                    if (next === 3) {
                        // 新校验逻辑：只要script-editor中有有效台词即可
                        const scriptLines = document.querySelectorAll('#script-editor .script-line');
                        let hasValidLine = false;
                        scriptLines.forEach(line => {
                            const text = line.querySelector('.line-input')?.value.trim();
                            if (text) hasValidLine = true;
                        });
                        if (!hasValidLine) {
                            alert('请先生成播客脚本');
                            return;
                        }
                    }
                    console.log('[步骤切换] 下一步按钮被点击，目标步骤：', next);
                    if (next >= 1 && next <= totalSteps) {
                        showStep(next);
                    }
                });
            }
        });
        // 上一步按钮
        document.querySelectorAll('.prev-step-btn').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    const prev = parseInt(this.getAttribute('data-prev'));
                    console.log('[步骤切换] 上一步按钮被点击，目标步骤：', prev);
                    if (prev >= 1 && prev <= totalSteps) {
                        showStep(prev);
                    }
                });
            }
        });
        // 步骤条点击跳转
        stepBarSteps.forEach((el, idx) => {
            if (el) {
                el.style.cursor = 'pointer';
                el.addEventListener('click', function() {
                    console.log('[步骤切换] 步骤条被点击，目标步骤：', idx + 1);
                    showStep(idx + 1);
                });
            }
        });
        // 初始化显示第1步
        showStep(1);
    })();

    // 页面加载时初始化
    updateRoleNames();

    // 加载可用的音色列表
    await loadAvailableVoices();

    // 1. 实时同步角色A/B名称到语音合成区
    function bindRoleNameSync() {
        const roleAInput = document.getElementById('roleA-name');
        const roleBInput = document.getElementById('roleB-name');
        const displayNameA = document.getElementById('display-name-A');
        const displayNameB = document.getElementById('display-name-B');
        if (roleAInput && displayNameA) {
            roleAInput.addEventListener('input', function() {
                displayNameA.textContent = roleAInput.value.trim() || '角色A';
                syncScriptEditorRoles();
            });
            displayNameA.textContent = roleAInput.value.trim() || '角色A';
        }
        if (roleBInput && displayNameB) {
            roleBInput.addEventListener('input', function() {
                displayNameB.textContent = roleBInput.value.trim() || '角色B';
                syncScriptEditorRoles();
            });
            displayNameB.textContent = roleBInput.value.trim() || '角色B';
        }
    }

    // 2. 切换到双人模式时强制刷新角色名显示
    function forceUpdateRoleNames() {
        const roleAInput = document.getElementById('roleA-name');
        const roleBInput = document.getElementById('roleB-name');
        const displayNameA = document.getElementById('display-name-A');
        const displayNameB = document.getElementById('display-name-B');
        if (roleAInput && displayNameA) displayNameA.textContent = roleAInput.value.trim() || '角色A';
        if (roleBInput && displayNameB) displayNameB.textContent = roleBInput.value.trim() || '角色B';
    }

    // 3. 切换模式时重置语音合成区参数和状态
    function resetTTSParamsOnModeSwitch() {
        // 可根据需要重置参数（如清空音频、重置进度等）
        const audioPlayer = document.getElementById('audio-player');
        const audioElement = document.getElementById('audio-element');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (audioPlayer) audioPlayer.style.display = 'none';
        if (audioElement) audioElement.src = '';
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '';
    }

    // 在DOMContentLoaded主函数内，初始化绑定
    bindRoleNameSync();

    // 修改模式切换事件，增加刷新和重置逻辑
    modeSingle.addEventListener('change', function() {
        updateRoleSettingsDisplay();
        updateTTSSettingsDisplay();
        resetTTSParamsOnModeSwitch();
    });
    modeDouble.addEventListener('change', function() {
        updateRoleSettingsDisplay();
        updateTTSSettingsDisplay();
        forceUpdateRoleNames();
        resetTTSParamsOnModeSwitch();
    });

    function syncScriptEditorRoles() {
        const roleAName = document.getElementById('roleA-name')?.value.trim() || '角色A';
        const roleBName = document.getElementById('roleB-name')?.value.trim() || '角色B';
        document.querySelectorAll('#script-editor .script-line').forEach(line => {
            const roleBtn = line.querySelector('.role-selector');
            if (!roleBtn) return;
            // 判断当前按钮是A还是B
            let current = roleBtn.textContent.replace(/\s*⇄.*/, '').trim();
            // 经典⇄符号
            const swapSymbol = ' ⇄';
            if (current === roleAName || current === roleBName) {
                // 已经是新名，无需处理
                return;
            }
            // 判断原来是A还是B
            const oldRoleA = roleBtn.getAttribute('data-old-role-a') || '角色A';
            const oldRoleB = roleBtn.getAttribute('data-old-role-b') || '角色B';
            if (current === oldRoleA) {
                roleBtn.innerHTML = roleAName + swapSymbol;
                line.setAttribute('data-role', roleAName);
            } else if (current === oldRoleB) {
                roleBtn.innerHTML = roleBName + swapSymbol;
                line.setAttribute('data-role', roleBName);
            }
            // 记录新旧映射，便于下次同步
            roleBtn.setAttribute('data-old-role-a', roleAName);
            roleBtn.setAttribute('data-old-role-b', roleBName);
        });
    }
});

// 保存角色名称到localStorage
function saveRoleNames(roleAName, roleBName) {
    if (roleAName) localStorage.setItem('roleAName', roleAName);
    if (roleBName) localStorage.setItem('roleBName', roleBName);
}

// 从localStorage加载角色名称
function loadRoleNames() {
    return {
        roleAName: localStorage.getItem('roleAName'),
        roleBName: localStorage.getItem('roleBName')
    };
}

// 更新角色名称显示
function updateRoleNames() {
    console.log('Updating role names...');
    const { roleAName, roleBName } = loadRoleNames();
    console.log('Retrieved names from localStorage:', { roleAName, roleBName });
    
    // 获取显示元素
    const displayNameA = document.getElementById('display-name-A');
    const displayNameB = document.getElementById('display-name-B');
    
    // 更新显示
    if (displayNameA) {
        displayNameA.textContent = roleAName || '角色A';
        console.log('Updated display name A:', displayNameA.textContent);
    }
    if (displayNameB) {
        displayNameB.textContent = roleBName || '角色B';
        console.log('Updated display name B:', displayNameB.textContent);
    }
}

// 初始化模式选择
function initializeModeSelection() {
    const singleMode = document.getElementById('single-mode');
    const doubleMode = document.getElementById('double-mode');
    const ttsSettingsSingle = document.getElementById('tts-settings-single');
    const ttsSettingsDouble = document.getElementById('tts-settings-double');

    if (singleMode && doubleMode) {
        singleMode.addEventListener('change', function() {
            if (this.checked) {
                ttsSettingsSingle.style.display = 'block';
                ttsSettingsDouble.style.display = 'none';
            }
        });

        doubleMode.addEventListener('change', function() {
            if (this.checked) {
                ttsSettingsSingle.style.display = 'none';
                ttsSettingsDouble.style.display = 'flex';
                updateRoleNames(); // 切换到双人模式时更新角色名称
            }
        });
    }
}

// 生成语音时使用保存的角色名称
async function generateAudio() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const text = document.getElementById('input-text').value;
    
    let requestData = {
        text: text,
        mode: mode
    };

    if (mode === 'double') {
        const { roleAName, roleBName } = loadRoleNames();
        requestData.roleAName = roleAName || '角色A';
        requestData.roleBName = roleBName || '角色B';
        requestData.roleAVoice = document.getElementById('voice-A').value || 'qingse-male';
        requestData.roleBVoice = document.getElementById('voice-B').value || 'qingse-female';
    } else {
        requestData.voice = document.getElementById('voice-single').value || 'qingse-male';
    }

    try {
        const response = await fetch('/api/generate_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            console.log('Audio generated successfully:', result);
            // TODO: 处理生成的音频
        } else {
            throw new Error(result.message || '生成音频失败');
        }
    } catch (error) {
        console.error('Error generating audio:', error);
        alert('生成音频失败: ' + error.message);
    }
}

// 加载可用的音色列表
async function loadAvailableVoices() {
    try {
        const response = await fetch('/api/available_voices');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            updateVoiceOptions(data.voices);
        } else {
            throw new Error(data.message || '加载音色失败');
        }
    } catch (error) {
        console.error('Error loading voices:', error);
        throw error;
    }
}

// 更新音色选项
function updateVoiceOptions(voices) {
    const voiceSelectors = ['voice-A', 'voice-B', 'voice-single'].map(id => document.getElementById(id));
    voiceSelectors.forEach(selector => {
        if (selector) {
            // 保存当前选中的值
            const currentValue = selector.value;
            // 清空现有选项
            selector.innerHTML = '';
            // 添加新选项
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voice_id;
                option.textContent = voice.voice_name;
                selector.appendChild(option);
            });
            // 恢复之前选中的值
            if (currentValue) {
                selector.value = currentValue;
            }
        }
    });
}

// 处理文件上传
async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showLoading();
        const response = await fetch('/api/extract_file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        alert('上传文件失败: ' + error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

// 处理URL提取
async function handleUrlExtract(url) {
    const formData = new FormData();
    formData.append('url', url);
    
    try {
        showLoading();
        const response = await fetch('/api/extract_url', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        alert('提取URL内容失败: ' + error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

// 渲染脚本编辑区（支持添加/删除段落）
function renderScriptEditorFromJson(jsonArr, mode = 'single', singleRoleName = '主播') {
    const editor = document.getElementById('script-editor');
    editor.innerHTML = '';
    jsonArr.forEach(item => {
        addScriptLine(item.role, item.text, mode, singleRoleName, editor);
    });
    // 渲染后自动显示"添加段落"按钮
    ensureAddLineBtn(mode, singleRoleName);
}

// 添加一行台词（支持外部调用和渲染时调用）
function addScriptLine(role = '角色A', text = '', mode = 'single', singleRoleName = '主播', editor = null, insertBefore = null) {
    if (!editor) editor = document.getElementById('script-editor');
    const lineDiv = document.createElement('div');
    lineDiv.className = 'script-line';

    // 角色按钮
    const roleBtn = document.createElement('button');
    roleBtn.className = 'role-selector';
    if (mode === 'single') {
        roleBtn.textContent = singleRoleName;
        roleBtn.disabled = true;
        roleBtn.style.cursor = 'not-allowed';
        roleBtn.title = '单人模式下角色不可切换';
    } else {
        const roleAName = document.getElementById('roleA-name')?.value || '角色A';
        const roleBName = document.getElementById('roleB-name')?.value || '角色B';
        // 经典⇄符号
        const swapSymbol = ' ⇄';
        let currentRole = (role === roleAName || role === roleBName) ? role : roleAName;
        roleBtn.innerHTML = currentRole + swapSymbol;
        lineDiv.setAttribute('data-role', currentRole);
        roleBtn.onclick = function() {
            currentRole = (currentRole === roleAName) ? roleBName : roleAName;
            roleBtn.innerHTML = currentRole + swapSymbol;
            lineDiv.setAttribute('data-role', currentRole);
        };
        roleBtn.title = '点击切换角色';
    }

    // 台词输入框
    const input = document.createElement('textarea');
    input.className = 'line-input';
    input.value = text || '';
    input.rows = 2;
    input.style.resize = 'none';
    // 自适应高度
    function autoResizeTextarea(el) {
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
    }
    input.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
    // 初始化时也自适应
    setTimeout(() => autoResizeTextarea(input), 0);

    // 删除按钮
    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete';
    delBtn.title = '删除';
    delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"/></svg>`;
    delBtn.onclick = function() {
        editor.removeChild(lineDiv);
    };

    // 插入按钮
    const insertBtn = document.createElement('button');
    insertBtn.className = 'icon-btn';
    insertBtn.title = '在此段下方插入新段落';
    insertBtn.innerHTML = '＋'; // 或SVG
    insertBtn.onclick = function() {
        if (lineDiv.nextSibling) {
            addScriptLine(role, '', mode, singleRoleName, editor, lineDiv.nextSibling);
        } else {
            addScriptLine(role, '', mode, singleRoleName, editor, null);
        }
    };

    // 组装顺序调整：角色按钮、台词输入框、删除按钮、插入按钮
    lineDiv.appendChild(roleBtn);
    lineDiv.appendChild(input);
    lineDiv.appendChild(delBtn);
    lineDiv.appendChild(insertBtn);

    if (insertBefore) {
        editor.insertBefore(lineDiv, insertBefore);
    } else {
        editor.appendChild(lineDiv);
    }

    // 同步更新DOM上的 role 属性，便于后续 getScriptJsonFromDOM 正确提取
    lineDiv.setAttribute('data-role', role);
}

// 移除全局添加段落按钮的相关逻辑
function ensureAddLineBtn() {}
