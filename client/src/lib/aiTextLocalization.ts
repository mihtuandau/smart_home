import { Language } from '@/i18n';

export function localizeAiText(text: string, language: Language) {
  if (!text || language === 'vi') return text;

  const source = text.trim();
  const isZh = language === 'zh';

  // Light turned off with thanks message - high priority
  const lightOffThankYou = source.match(/^(?:Light|Đèn)\s*(\d+)\s*đã tắt\.\s*Hành động nhỏ tiết kiệm lớn, hệ thống cảm ơn bạn!$/i);
  if (lightOffThankYou) {
    return isZh
      ? `灯 ${lightOffThankYou[1]} 已关闭。小举措，大节省，系统感谢你！`
      : `Light ${lightOffThankYou[1]} has been turned off. Small actions, big savings, the system thanks you!`;
  }

  // Handle hybrid Vietnamese/English messages by extracting and translating the whole thing
  const hybridSavingMessage = source.match(/^Thật tuyệt!\s*(?:Light|Đèn)\s*(\d+)\s*vừa tắt, giúp bạn tiết kiệm được khoảng\s*([\d.]+)\s*đ\s*(?:mỗi ngày|per day)\.$/i);
  if (hybridSavingMessage) {
    return isZh
      ? `很棒！灯 ${hybridSavingMessage[1]} 刚关闭，帮你每天省约 ${hybridSavingMessage[2]} VND。`
      : `Great! Light ${hybridSavingMessage[1]} just turned off, helps you save about ${hybridSavingMessage[2]} VND per day.`;
  }

  const hybridCostMessage = source.match(/^(?:Light|Đèn)\s*(\d+)\s*vừa bật\s*[—–-]\s*làm tăng tải thêm\s*([\d.]+)\s*W\.\s*Tương đương\s*(?:equivalent to costs about|tốn khoảng)\s*([\d.]+)\s*đ\s*(?:per day|mỗi ngày)\s*nếu giữ liên tục\.$/i);
  if (hybridCostMessage) {
    return isZh
      ? `灯 ${hybridCostMessage[1]} 刚打开 - 负载增加 ${hybridCostMessage[2]} W。相当于花费约 ${hybridCostMessage[3]} VND/天（如果持续开启）。`
      : `Light ${hybridCostMessage[1]} just turned on — load increased by ${hybridCostMessage[2]} W. Equivalent to spending about ${hybridCostMessage[3]} VND per day if kept on.`;
  }

  const hybridDetectedMessage = source.match(/^Phát hiện bật\s*(?:Light|Đèn)\s*(\d+)\.\s*(?:Using lights wisely will save electricity, remember to turn off when not in use nhé!|Bật đèn hợp lý sẽ giúp tiết kiệm điện, đừng quên tắt khi không dùng nhé!)$/i);
  if (hybridDetectedMessage) {
    return isZh
      ? `检测到灯 ${hybridDetectedMessage[1]} 打开。合理使用灯会节省电力，不用时请记得关闭！`
      : `Detected Light ${hybridDetectedMessage[1]} turned on. Using lights wisely will save electricity, remember to turn off when not in use!`;
  }

  const hybridRememberMessage = source.match(/^Phát hiện bật Light (\d+)\.\s*Remember to use natural light !$/i);
  if (hybridRememberMessage) {
    return isZh
      ? `检测到 Light ${hybridRememberMessage[1]} 打开。记得利用自然光！`
      : `Detected Light ${hybridRememberMessage[1]} turned on. Remember to use natural light!`;
  }

  const hybridBudgetMessage = source.match(/^Quá chuẩn!\s*Đêm qua hoặc nãy giờ bạn đã tắt\s*(?:Light|Đèn)\s*(\d+),\s*(?:additionally saved|tiết kiệm thêm được)\s*([\d.]+)\s*đ\.$/i);
  if (hybridBudgetMessage) {
    return isZh
      ? `完美！你昨晚或刚才关闭了灯 ${hybridBudgetMessage[1]}，又省了 ${hybridBudgetMessage[2]} VND。`
      : `Perfect! You turned off Light ${hybridBudgetMessage[1]} last night or just now, additionally saved ${hybridBudgetMessage[2]} VND.`;
  }

  // Fix typo version of saving message
  const savingSavingTypo = source.match(/^Thật tuyệt!\s*Light (\d+) vừa tắt, giúp bạn tiết k?i?ệm được khoảng\s*([\d.]+)đ\s*per day\.$/i);
  if (savingSavingTypo) {
    return isZh
      ? `很棒！Light ${savingSavingTypo[1]} 刚关闭，帮你每天省约 ${savingSavingTypo[2]} 元。`
      : `Great! Light ${savingSavingTypo[1]} just turned off, helps you save about ${savingSavingTypo[2]} yuan per day.`;
  }

  // Light turned on - Vietnamese message
  const lightTurnedOnVi = source.match(/^(?:Light|Đèn)\s*(\d+)\s*vừa bật\s*[—–-]\s*làm tăng tải thêm\s*([\d.]+)\s*W\.\s*Sẽ tốn thêm tầm\s*([\d.]+)\s*đ\/ngày nếu không tắt\.$/i);
  if (lightTurnedOnVi) {
    return isZh
      ? `灯 ${lightTurnedOnVi[1]} 刚打开 - 负载增加 ${lightTurnedOnVi[2]} W。如果不关闭，每天将额外消耗约 ${lightTurnedOnVi[3]} VND。`
      : `Light ${lightTurnedOnVi[1]} just turned on — load increased by ${lightTurnedOnVi[2]} W. Will cost about ${lightTurnedOnVi[3]} VND/day if not turned off.`;
  }

  // Light off - hybrid message
  const lightOffHybrid = source.match(/^(?:Light|Đèn)\s*(\d+)\s*đã tắt,\s*(?:your monthly budget is a bit fuller|ngân sách tháng này lại rủng rỉnh thêm một chút rồi!)$/i);
  if (lightOffHybrid) {
    return isZh
      ? `灯 ${lightOffHybrid[1]} 已关闭，你的月度预算又充足了一点！`
      : `Light ${lightOffHybrid[1]} has been turned off, your monthly budget is a bit fuller!`;
  }

  if (/^\s*Điện tiêu thụ đột ngột bất thường\s*[—–-]\s*vui lòng kiểm tra thiết bị trong nhà$/i.test(source)) {
    return isZh
      ? ' 检测到异常突增的用电量 - 请检查家中的设备'
      : ' Abnormal sudden power consumption detected — please check devices in your home';
  }

  const turnedOn = source.match(/^\s*Đèn\s*(\d+)\s*vừa bật\s*[—–-]\s*điện tăng thêm\s*([\d.]+)\s*W\s*\(đang dùng:\s*([\d.]+)\s*W\)$/i);
  if (turnedOn) {
    return isZh
      ? ` 灯 ${turnedOn[1]} 刚刚打开 - 功率增加 ${turnedOn[2]} W（当前用电：${turnedOn[3]} W）`
      : ` Light ${turnedOn[1]} just turned on — power increased by ${turnedOn[2]} W (now using: ${turnedOn[3]} W)`;
  }

  const turnedOff = source.match(/^\s*Đèn\s*(\d+)\s*vừa tắt\s*[—–-]\s*điện giảm\s*([\d.]+)\s*W\s*\(hiện tiêu thụ:\s*([\d.]+)\s*W\)$/i);
  if (turnedOff) {
    return isZh
      ? ` 灯 ${turnedOff[1]} 刚刚关闭 - 功率降低 ${turnedOff[2]} W（当前耗电：${turnedOff[3]} W）`
      : ` Light ${turnedOff[1]} just turned off — power decreased by ${turnedOff[2]} W (current consumption: ${turnedOff[3]} W)`;
  }

  const changedCurrent = source.match(/^\s*Đèn\s*(\d+)\s*thay đổi\s*[—–-]\s*điện tiêu thụ hiện tại:\s*([\d.]+)\s*W$/i);
  if (changedCurrent) {
    return isZh
      ? ` 灯 ${changedCurrent[1]} 状态已变化 - 当前功耗：${changedCurrent[2]} W`
      : ` Light ${changedCurrent[1]} changed — current power consumption: ${changedCurrent[2]} W`;
  }

  const allOffNormal = source.match(/^\s*Đèn đã tắt hết\s*[—–-]\s*điện tiêu thụ thấp, bình thường\s*\(([\d.]+)\s*W\)$/i);
  if (allOffNormal) {
    return isZh
      ? ` 所有灯已关闭 - 低功耗，状态正常（${allOffNormal[1]} W）`
      : ` All lights are off — low power consumption, normal (${allOffNormal[1]} W)`;
  }

  const allOffButHigh = source.match(/^️?\s*Điện vẫn cao dù đèn đã tắt hết\s*\(([\d.]+)\s*W,\s*mức thường:\s*~?([\d.]+)\s*W\)\s*[—–-]\s*có thiết bị nào quên tắt không\?$/i);
  if (allOffButHigh) {
    return isZh
      ? `️ 所有灯已关闭但功耗仍然偏高（${allOffButHigh[1]} W，常规约：${allOffButHigh[2]} W）- 是否有其他设备忘记关闭？`
      : `️ Power is still high even though all lights are off (${allOffButHigh[1]} W, usual level: ~${allOffButHigh[2]} W) — did you forget to turn off another device?`;
  }

  const higherThanUsual = source.match(/^️?\s*Điện cao hơn mức thường\s*([\d.]+)%\s*[—–-]\s*nên kiểm tra xem có thiết bị nào bật quên không\??$/i);
  if (higherThanUsual) {
    return isZh
      ? `️ 当前功耗比平时高 ${higherThanUsual[1]}% - 请检查是否有设备忘记关闭`
      : `️ Power is ${higherThanUsual[1]}% higher than usual — please check whether any device was left on`;
  }

  const ledOnNormal = source.match(/^\s*(.+?)\s*đang bật\s*[—–-]\s*mức điện bình thường\s*\(([\d.]+)\s*W\)$/i);
  if (ledOnNormal) {
    const ledName = ledOnNormal[1]
      .replace(/Đèn\s*1\s*\+\s*Đèn\s*2/i, isZh ? '灯 1 + 灯 2' : 'Light 1 + Light 2')
      .replace(/Đèn\s*(\d+)/gi, isZh ? '灯 $1' : 'Light $1');
    return isZh
      ? ` ${ledName} 已开启 - 功耗水平正常（${ledOnNormal[2]} W）`
      : ` ${ledName} is on — normal power level (${ledOnNormal[2]} W)`;
  }

  const ledOnPower = source.match(/^\s*(.+?)\s*đang bật\s*[—–-]\s*điện tiêu thụ\s*([\d.]+)\s*W$/i);
  if (ledOnPower) {
    const ledName = ledOnPower[1]
      .replace(/Đèn\s*1\s*\+\s*Đèn\s*2/i, isZh ? '灯 1 + 灯 2' : 'Light 1 + Light 2')
      .replace(/Đèn\s*(\d+)/gi, isZh ? '灯 $1' : 'Light $1');
    return isZh
      ? ` ${ledName} 已开启 - 当前功耗：${ledOnPower[2]} W`
      : ` ${ledName} is on — power consumption: ${ledOnPower[2]} W`;
  }

  if (/^\s*Gợi ý:\s*Tắt bớt đèn không cần thiết để tiết kiệm điện$/i.test(source)) {
    return isZh
      ? ' 建议：关闭不必要的灯以节省电力'
      : ' Suggestion: Turn off unnecessary lights to save energy';
  }

  const lightsOff = source.match(/^\s*Đèn vừa tắt\s*[—–-]\s*điện giảm\s*([\d.]+)\s*W\s*\(điện chờ hiện tại:\s*([\d.]+)\s*W\)$/i);
  if (lightsOff) {
    return isZh
      ? ` 灯刚刚关闭 - 功率下降 ${lightsOff[1]} W（当前待机功耗：${lightsOff[2]} W）`
      : ` Lights just turned off — power decreased by ${lightsOff[1]} W (standby power: ${lightsOff[2]} W)`;
  }

  const aiLearning = source.match(/^\s*AI đang làm quen với thiết bị của bạn\.*\s*\((\d+)\/(\d+)\)$/i);
  if (aiLearning) {
    return isZh
      ? ` AI 正在学习你的设备习惯...（${aiLearning[1]}/${aiLearning[2]}）`
      : ` AI is learning your devices... (${aiLearning[1]}/${aiLearning[2]})`;
  }

  const stillHighNoHet = source.match(/^️?\s*Điện vẫn cao dù đèn đã tắt\s*\(([\d.]+)\s*W\)\s*[—–-]\s*có thiết bị nào đang bật không\?$/i);
  if (stillHighNoHet) {
    return isZh
      ? `️ 灯已关闭但功耗仍偏高（${stillHighNoHet[1]} W）- 是否还有其他设备在运行？`
      : `️ Power is still high even though lights are off (${stillHighNoHet[1]} W) — is another device still on?`;
  }

  const allOffLow = source.match(/^\s*Đèn đã tắt\s*[—–-]\s*điện tiêu thụ thấp\s*\(([\d.]+)\s*W\)$/i);
  if (allOffLow) {
    return isZh
      ? ` 灯已关闭 - 低功耗（${allOffLow[1]} W）`
      : ` Lights are off — low power consumption (${allOffLow[1]} W)`;
  }

  const batteryHigher = source.match(/^\s*Điện đang cao hơn mức thường\s*([\d.]+)%\s*[—–-]\s*đang dùng\s*([\d.]+)\s*W\s*thay vì\s*~?([\d.]+)\s*W\s*như thường lệ$/i);
  if (batteryHigher) {
    return isZh
      ? ` 当前功耗比平时高 ${batteryHigher[1]}% - 当前 ${batteryHigher[2]} W，平时约 ${batteryHigher[3]} W`
      : ` Power is ${batteryHigher[1]}% higher than usual — using ${batteryHigher[2]} W instead of ~${batteryHigher[3]} W as usual`;
  }

  // Routine Predictions
  const predictiveEvening = source.match(/^Gợi ý thông minh: AI phân tích dữ liệu 30 ngày qua thấy bạn hay dùng điện lúc (\d+)h\. Sắp tối rồi, bạn có muốn tôi bật chiếu sáng sớm giúp không\? 🌙$/i);
  if (predictiveEvening) {
    return isZh
      ? `智能建议：AI分析了过去30天的数据，发现你经常在 ${predictiveEvening[1]}点 用电。天快黑了，需要为你提前开启照明吗？🌙`
      : `Smart Suggestion: AI analyzed 30 days of data and noticed you usually use electricity around ${predictiveEvening[1]}h. It's getting dark, would you like me to turn on the lights for you? 🌙`;
  }

  const predictiveEvening2 = source.match(/^AI Tiên Đoán: Ánh sáng ngoài trời sắp giảm\. Bạn có muốn kích hoạt kịch bản "Bình Minh Tối" như thói quen (\d+)h mọi ngày không\?$/i);
  if (predictiveEvening2) {
    return isZh
      ? `AI 预测：室外光线即将变暗。要按照每天 ${predictiveEvening2[1]}点的习惯激活“傍晚照明”场景吗？`
      : `AI Prediction: Outdoor light is decreasing. Would you like to activate the "Evening Lights" scene as per your daily ${predictiveEvening2[1]}h routine?`;
  }

  const predictiveMorning = source.match(/^Gợi ý thông minh: AI phân tích thói quen sáng quanh mức (\d+)h của bạn! Bạn có muốn ngắt điện các thiết bị ban đêm không\? ☀️$/i);
  if (predictiveMorning) {
    return isZh
      ? `智能建议：AI分析了你约 ${predictiveMorning[1]}点的早晨习惯！需要关闭夜间设备吗？☀️`
      : `Smart Suggestion: AI analyzed your morning routine around ${predictiveMorning[1]}h! Would you like to turn off nighttime devices? ☀️`;
  }

  // Z-Score Standby Alerts
  const standbyZScore = source.match(/^️?\s*⚠️\s*Z-Score Cảnh báo: Tải nền rò rỉ rất đắt đỏ\. Bạn sẽ lãng phí ([\d.]+)VNĐ vào cuối tháng nếu giữ mức tải này khi đã tắt đèn\.$/i);
  if (standbyZScore) {
    return isZh
      ? `⚠️ Z-Score 警告：待机漏电非常昂贵。如果关灯后保持此负载，月底你将浪费 ${standbyZScore[1]} VND。`
      : `⚠️ Z-Score Warning: Standby leakage is very costly. You will waste ${standbyZScore[1]} VND by the end of the month if you keep this load when lights are off.`;
  }

  const standbyAbnormal = source.match(/^️?\s*⚠️\s*Tải nền đang cao bất thường! Ước tính hóa đơn sẽ ĐỘI THÊM ([\d.]+)đ tháng này nếu bạn không kiểm tra ngay các thiết bị chạy ngầm!$/i);
  if (standbyAbnormal) {
    return isZh
      ? `⚠️ 待机负载异常偏高！如果你不立即检查后台设备，本月电费估计将增加 ${standbyAbnormal[1]} VND！`
      : `⚠️ Standby load is abnormally high! Estimated bill will INCREASE by ${standbyAbnormal[1]} VND this month if you don't check background devices immediately!`;
  }

  const billingWarning = source.match(/^️?\s*⚠️\s*Cảnh báo tiền điện!\s*Thiết bị công suất khủng đang đốt của bạn khoảng\s*([\d.]+)đ\s*MỖI GIỜ\.\s*(.+)$/i);
  if (billingWarning) {
    const advice = billingWarning[2]
      .replace(/Hãy tắt ngay bình nóng lạnh hoặc thiết bị nặng nếu không dùng!/gi, isZh ? '请立即关闭热水器或大功率设备（如果不使用）！' : 'Please turn off water heater or high-power devices immediately if not in use!')
      .replace(/Gợi ý:\s*bật đồng thời 2 đèn chỉ khi cần thiết để tối ưu điện năng/gi, isZh ? '建议：仅在必要时同时打开 2 盏灯以优化用电' : 'Suggestion: Turn on both lights only when necessary to optimize power usage');
    return isZh
      ? `⚠️ 电费警告！大功率设备正在消耗约 ${billingWarning[1]} 元/小时。${advice}`
      : `⚠️ Billing Alert! High-power devices are consuming about ${billingWarning[1]} yuan/hour. ${advice}`;
  }

  const anomalyAlert = source.match(/^️?\s*⚠️\s*Bất thường Cấp độ\s*(\d+)?\s*\(Z-Score\):\s*Tải đỉnh báo động đỏ\.\s*Bạn đang đốt tiền điện rất nhanh\s*\(([\d.]+)đ\/giờ\)\.\s*(.+)$/i);
  if (anomalyAlert) {
    const advice = anomalyAlert[3]
      .replace(/Ưu tiên giảm công suất lập tức!/gi, isZh ? '立即优先降低功率！' : 'Prioritize reducing power immediately!')
      .replace(/Nếu độ sáng đã đủ, bạn có thể tắt bớt một đèn để giảm tiêu thụ/gi, isZh ? '如果光线充足，可以关闭一盏灯以降低消耗' : 'If lighting is sufficient, you can turn off one light to reduce consumption');
    return isZh
      ? `⚠️ 异常告警 级别 ${anomalyAlert[1] || '3'} (Z-Score)：峰值负载红色警报。你正在以极快的速度消耗电费（${anomalyAlert[2]} 元/小时）。${advice}`
      : `⚠️ Anomaly Alert Level ${anomalyAlert[1] || '3'} (Z-Score): Peak load red alert. You're burning money very fast (${anomalyAlert[2]} VND/hour). ${advice}`;
  }

  // Power Spikes & High Consumption
  const powerSpike = source.match(/^️?\s*(?:️\s*)?Công suất vừa (tăng|giảm) nhanh ([\d.]+) W dù trạng thái đèn không đổi\s*[—–-]\s*nên kiểm tra tải tức thời$/i);
  if (powerSpike) {
    const trend = powerSpike[1] === 'tăng' ? (isZh ? '增加' : 'increased') : (isZh ? '减少' : 'decreased');
    return isZh
      ? ` 功耗刚才快速${trend}了 ${powerSpike[2]} W，尽管灯的状态未改变 - 请检查即时负载`
      : ` Power just ${trend} rapidly by ${powerSpike[2]} W even though light states haven't changed — please check the instantaneous load`;
  }

  const loadHigh = source.match(/^Đang có thiết bị tiêu thụ khá mạnh, tốn khoảng ([\d.]+)đ\/giờ\. Chú ý chi phí nhé!$/i);
  if (loadHigh) {
    return isZh
      ? ` 有设备功耗较高，每小时约花费 ${loadHigh[1]} VND。请注意电费开支！`
      : ` A device is consuming significant power, costing about ${loadHigh[1]} VND/hour. Watch your costs!`;
  }

  const costWarningNormal = source.match(/^Cảnh báo chi phí: Công suất đang vọt lên, hệ thống ghi nhận bạn đang xài lố so với thói quen hằng ngày\.$/i);
  if (costWarningNormal) {
    return isZh
      ? ` 费用警告：功耗正在飙升，系统记录到你的用电量超过了日常习惯。`
      : ` Cost Warning: Power usage is surging; the system detects consumption exceeding your daily routine.`;
  }

  // Weekly Summary Fallbacks
  const weeklySummary = source.match(/^Tuần qua nhà mình đã dùng ([\d.]+) kWh\. Đã có (\d+) lần quên tắt đèn ban đêm\. Việc để quên này tuy tốn ít điện \(khoảng 0\.5W\/đèn\) nhưng sẽ lãng phí từ từ đó nha!$/i);
  if (weeklySummary) {
    return isZh
      ? `上周你家使用了 ${weeklySummary[1]} kWh 电量。有 ${weeklySummary[2]} 次忘记关闭夜间灯光。虽然忘记关灯耗电不多（每盏约 0.5W），但日积月累也是一种浪费哦！`
      : `Last week your family used ${weeklySummary[1]} kWh. You forgot to turn off nighttime lights ${weeklySummary[2]} times. Although leaving them on uses little power (~0.5W/light), it adds up over time!`;
  }

  const detectedLightOn1 = source.match(/^\s*Phát hiện bật\s*Light\s*(\d+)\.\s*(.+)$/i);
  if (detectedLightOn1) {
    const advice = detectedLightOn1[2]
      .replace(/Bật đèn hợp lý sẽ giúp tiết kiệm điện, đừng quân tắt khi không dùng nhé!/gi, isZh ? '合理开灯将节省电力，不用时请关闭！' : 'Turning on lights wisely will save electricity, don\'t forget to turn off when not in use!')
      .replace(/Bật đèn hợp lý sẽ giúp tiết kiệm điện, đừng quên tắt khi không dùng nhé!/gi, isZh ? '合理开灯将节省电力，不用时请关闭！' : 'Turning on lights wisely will save electricity, don\'t forget to turn off when not in use!')
      .replace(/Nhớ tận dụng ánh sáng tự nhiên nếu được nhé!/gi, isZh ? '记得利用自然光！' : 'Remember to use natural light!')
      .replace(/Remember to use natural light/gi, isZh ? '记得利用自然光' : 'Remember to use natural light');
    return isZh
      ? ` 检测到 Light ${detectedLightOn1[1]} 打开。${advice}`
      : ` Detected Light ${detectedLightOn1[1]} turned on. ${advice}`;
  }

  // Standalone messages
  const detectedLightStandalone = source.match(/^\s*Phát hiện bật\s*Light\s*(\d+)\.\s*$/i);
  if (detectedLightStandalone) {
    return isZh
      ? `检测到 Light ${detectedLightStandalone[1]} 打开。`
      : `Detected Light ${detectedLightStandalone[1]} turned on.`;
  }

  const rememberNaturalLight = source.match(/^Remember to use natural light\s*!?\s*$/i);
  if (rememberNaturalLight) {
    return isZh
      ? '记得利用自然光！'
      : 'Remember to use natural light if possible!';
  }

  const rememberNaturalLightVi = source.match(/^Nhớ tận dụng ánh sáng tự nhiên.*$/i);
  if (rememberNaturalLightVi) {
    return isZh
      ? '记得利用自然光！'
      : 'Remember to use natural light if possible!';
  }

  const lightPowerIncrease = source.match(/^\s*Light\s*(\d+)\s*vừa bật\s*[—–-]\s*làm tăng tải thêm\s*([\d.]+)\s*W\.\s*Sẽ tốn thêm tầm\s*([\d.]+)đ\/ngày nếu không tắt\.$/i);
  if (lightPowerIncrease) {
    return isZh
      ? ` Light ${lightPowerIncrease[1]} 刚刚打开 - 负载增加 ${lightPowerIncrease[2]} W。如果不关闭，每天将额外消耗约 ${lightPowerIncrease[3]} 元。`
      : ` Light ${lightPowerIncrease[1]} just turned on — load increased by ${lightPowerIncrease[2]} W. Will cost about ${lightPowerIncrease[3]} yuan/day if not turned off.`;
  }

  const lightOffBudget = source.match(/^\s*Light\s*(\d+)\s*đã tắt, ngân sách tháng này lại rủng rỉnh thêm một chút rồi!$/i);
  if (lightOffBudget) {
    return isZh
      ? ` Light ${lightOffBudget[1]} 已关闭，本月预算又充足了一点！`
      : ` Light ${lightOffBudget[1]} has been turned off, your monthly budget is a bit fuller now!`;
  }

  const savingSuccess = source.match(/^\s*Thật tuyệt!\s*Light\s*(\d+)\s*vừa tắt, giúp bạn tiết kiệm được khoảng\s*([\d.]+)đ\s*mỗi ngày\.$/i);
  if (savingSuccess) {
    return isZh
      ? ` 很棒！Light ${savingSuccess[1]} 刚关闭，帮你每天省约 ${savingSuccess[2]} 元。`
      : ` Great! Light ${savingSuccess[1]} just turned off, helps you save about ${savingSuccess[2]} yuan per day.`;
  }

  const savingPercent = source.match(/^\s*Quá chuẩn!\s*Đêm qua hoặc nãy giờ bạn đã tắt\s*Light\s*(\d+), tiết kiệm thêm được\s*([\d.]+)đ\.$/i);
  if (savingPercent) {
    return isZh
      ? ` 完美！你昨晚或刚才关闭了 Light ${savingPercent[1]}，又省了 ${savingPercent[2]} 元。`
      : ` Perfect! You turned off Light ${savingPercent[1]} last night or just now, saving ${savingPercent[2]} yuan.`;
  }

  const correspondingCost = source.match(/^\s*Light\s*(\d+)\s*vừa bật\s*[—–-]\s*làm tăng tải thêm\s*([\d.]+)\s*W\.\s*Tương đương tốn khoảng\s*([\d.]+)đ\s*mỗi ngày nếu giữ liên tục\.$/i);
  if (correspondingCost) {
    return isZh
      ? ` Light ${correspondingCost[1]} 刚打开 - 负载增加 ${correspondingCost[2]} W。如果持续开启，相当于每天花费约 ${correspondingCost[3]} 元。`
      : ` Light ${correspondingCost[1]} just turned on — load increased by ${correspondingCost[2]} W. Equivalent to spending about ${correspondingCost[3]} yuan per day if kept on.`;
  }

  // Additional alert patterns
  const basicAlert = source.match(/^✅\s*AI:\s*(.+)$/i);
  if (basicAlert) {
    return isZh
      ? `✅ AI：${basicAlert[1]}`
      : `✅ AI: ${basicAlert[1]}`;
  }

  const analysisAlert = source.match(/^📊\s*AI:\s*(.+)$/i);
  if (analysisAlert) {
    return isZh
      ? `📊 AI：${analysisAlert[1]}`
      : `📊 AI: ${analysisAlert[1]}`;
  }

  const warningAlert = source.match(/^⚠️\s*AI\s*Cảnh báo:\s*(.+)$/i);
  if (warningAlert) {
    return isZh
      ? `⚠️ AI 警告：${warningAlert[1]}`
      : `⚠️ AI Warning: ${warningAlert[1]}`;
  }

  const commentAlert = source.match(/^⚠️\s*AI\s*Nhận xét:\s*(.+)$/i);
  if (commentAlert) {
    return isZh
      ? `⚠️ AI 评论：${commentAlert[1]}`
      : `⚠️ AI Comment: ${commentAlert[1]}`;
  }

  const adviceAlert = source.match(/^💡\s*Gợi ý:\s*(.+)$/i);
  if (adviceAlert) {
    return isZh
      ? `💡 建议：${adviceAlert[1]}`
      : `💡 Suggestion: ${adviceAlert[1]}`;
  }

  const batteryAdvice = source.match(/^🔋\s*Gợi ý:\s*(.+)$/i);
  if (batteryAdvice) {
    return isZh
      ? `🔋 建议：${batteryAdvice[1]}`
      : `🔋 Suggestion: ${batteryAdvice[1]}`;
  }

  const anomalyDetection = source.match(/^🚨\s*AI ML:\s*(.+)$/i);
  if (anomalyDetection) {
    return isZh
      ? `🚨 AI ML：${anomalyDetection[1]}`
      : `🚨 AI ML: ${anomalyDetection[1]}`;
  }

  const dailyReport = source.match(/^📅\s*(.+)$/i);
  if (dailyReport) {
    const text = dailyReport[1]
      .replace(/Trung bình công suất hôm nay:/gi, isZh ? '今天平均功率：' : 'Today average power:')
      .replace(/Không có dữ liệu để tổng hợp/gi, isZh ? '没有数据用于总结' : 'No data to summarize');
    return isZh
      ? `📅 ${text}`
      : `📅 ${text}`;
  }

  // Handle standalone advice lines (often appear as second message)
  const standaloneAdvice1 = source.match(/^Nếu độ sáng đã đủ, bạn có thể tắt bớt một đèn để giảm tiêu thụ$/i);
  if (standaloneAdvice1) {
    return isZh
      ? '如果光线充足，可以关闭一盏灯以降低消耗'
      : 'If lighting is sufficient, you can turn off one light to reduce consumption';
  }

  const standaloneAdvice2 = source.match(/^Gợi ý:\s*bật đồng thời 2 đèn chỉ khi cần thiết để tối ưu điện năng$/i);
  if (standaloneAdvice2) {
    return isZh
      ? '建议：仅在必要时同时打开 2 盏灯以优化用电'
      : 'Suggestion: Turn on both lights only when necessary to optimize power usage';
  }

  // Handle mixed English/Vietnamese messages (partial translations)
  const mixedMessage1 = source.match(/^Phát hiện bật Light (\d+)\.\s*Using lights Wisely Will save electricity, remember to turn off When not in use nhé!$/i);
  if (mixedMessage1) {
    return isZh
      ? `检测到 Light ${mixedMessage1[1]} 打开。合理使用灯会节省电力，不使用时请记得关闭！`
      : `Detected Light ${mixedMessage1[1]} turned on. Using lights wisely will save electricity, remember to turn off when not in use!`;
  }

  const mixedMessage2 = source.match(/^Phát hiện bật Light (\d+)\.\s*Remember to use natural light nếu được nhé!$/i);
  if (mixedMessage2) {
    return isZh
      ? `检测到 Light ${mixedMessage2[1]} 打开。记得利用自然光！`
      : `Detected Light ${mixedMessage2[1]} turned on. Remember to use natural light if possible!`;
  }

  const mixedMessage3 = source.match(/^Thật tuyệt!\s*Light (\d+) vừa tắt, giúp bạn tiết kiệm được khoảng\s*([\d.]+)đ\s*per day\.$/i);
  if (mixedMessage3) {
    return isZh
      ? `很棒！Light ${mixedMessage3[1]} 刚关闭，帮你每天省约 ${mixedMessage3[2]} 元。`
      : `Great! Light ${mixedMessage3[1]} just turned off, helps you save about ${mixedMessage3[2]} yuan per day.`;
  }

  const mixedMessage4 = source.match(/^Quá chuẩn!\s*Đêm qua hoặc nãy giờ bạn đã tắt Light (\d+), additionally saved\s*([\d.]+)đ\.$/i);
  if (mixedMessage4) {
    return isZh
      ? `完美！你昨晚或刚才关闭了 Light ${mixedMessage4[1]}，又省了 ${mixedMessage4[2]} 元。`
      : `Perfect! You turned off Light ${mixedMessage4[1]} last night or just now, additionally saved ${mixedMessage4[2]} yuan.`;
  }

  const mixedMessage5 = source.match(/^Light (\d+) vừa bật — làm tăng tải thêm\s*([\d.]+) W\.\s*Tương đương costs about\s*([\d.]+)đ\s*per day nếu giữ liên tục\.$/i);
  if (mixedMessage5) {
    return isZh
      ? `Light ${mixedMessage5[1]} 刚打开 - 负载增加 ${mixedMessage5[2]} W。如果持续开启，每天花费约 ${mixedMessage5[3]} 元。`
      : `Light ${mixedMessage5[1]} just turned on — load increased by ${mixedMessage5[2]} W. Equivalent to costs about ${mixedMessage5[3]} yuan per day if kept on.`;
  }

  const mixedMessage6 = source.match(/^Light (\d+) đã tắt, your monthly budget is a bit fuller$/i);
  if (mixedMessage6) {
    return isZh
      ? `Light ${mixedMessage6[1]} 已关闭，你的月度预算又充足了一点！`
      : `Light ${mixedMessage6[1]} has been turned off, your monthly budget is a bit fuller!`;
  }

  return source
    .replace(/Chưa đủ dữ liệu để phân tích/gi, isZh ? '数据不足以进行分析' : 'Insufficient data for analysis')
    .replace(/Dữ liệu không hợp lệ để phân tích/gi, isZh ? '数据无效无法分析' : 'Data is invalid for analysis')
    .replace(/Mức tiêu thụ điện ổn định/gi, isZh ? '电力消耗水平稳定' : 'Power consumption stable')
    .replace(/Không thể phát hiện hành vi bất thường/gi, isZh ? '无法检测到异常行为' : 'Cannot detect anomalous behavior')
    .replace(/Phát hiện bất thường trong hành vi tiêu thụ/gi, isZh ? '检测到异常用电行为' : 'Abnormal power consumption behavior detected')
    .replace(/đang dùng:/gi, isZh ? '当前用电：' : 'now using:')
    .replace(/hiện tiêu thụ:/gi, isZh ? '当前耗电：' : 'current consumption:')
    .replace(/Điện tiêu thụ đột ngột bất thường/gi, isZh ? '检测到异常突增的用电量' : 'Abnormal sudden power consumption detected')
    .replace(/vui lòng kiểm tra thiết bị trong nhà/gi, isZh ? '请检查家中的设备' : 'please check devices in your home')
    .replace(/Đèn đã tắt hết\s*[—–-]\s*điện tiêu thụ thấp, bình thường/gi, isZh ? '所有灯已关闭 - 低功耗，状态正常' : 'All lights are off — low power consumption, normal')
    .replace(/Điện vẫn cao dù đèn đã tắt hết/gi, isZh ? '所有灯已关闭但功耗仍然偏高' : 'Power is still high even though all lights are off')
    .replace(/Điện cao hơn mức thường\s*([\d.]+)%/gi, isZh ? '当前功耗比平时高 $1%' : 'Power is $1% higher than usual')
    .replace(/mức thường:/gi, isZh ? '常规：' : 'usual level:')
    .replace(/có thiết bị nào quên tắt không\?/gi, isZh ? '是否有其他设备忘记关闭？' : 'did you forget to turn off another device?')
    .replace(/nên kiểm tra xem có thiết bị nào bật quên không\??/gi, isZh ? '请检查是否有设备忘记关闭' : 'please check whether any device was left on')
    .replace(/Đèn\s*(\d+)\s*thay đổi\s*[—–-]\s*điện tiêu thụ hiện tại:/gi, isZh ? '灯 $1 状态已变化 - 当前功耗：' : 'Light $1 changed — current power consumption:')
    .replace(/đang bật\s*[—–-]\s*mức điện bình thường/gi, isZh ? '已开启 - 功耗水平正常' : 'is on — normal power level')
    .replace(/đang bật\s*[—–-]\s*điện tiêu thụ/gi, isZh ? '已开启 - 当前功耗：' : 'is on — power consumption:')
    .replace(/Gợi ý:\s*Tắt bớt đèn không cần thiết để tiết kiệm điện/gi, isZh ? '建议：关闭不必要的灯以节省电力' : 'Suggestion: Turn off unnecessary lights to save energy')
    .replace(/Đèn vừa tắt\s*[—–-]\s*điện giảm/gi, isZh ? '灯刚刚关闭 - 功率下降' : 'Lights just turned off — power decreased by')
    .replace(/điện chờ hiện tại:/gi, isZh ? '当前待机功耗：' : 'standby power:')
    .replace(/AI đang làm quen với thiết bị của bạn/gi, isZh ? 'AI 正在学习你的设备习惯' : 'AI is learning your devices')
    .replace(/Điện vẫn cao dù đèn đã tắt/gi, isZh ? '灯已关闭但功耗仍偏高' : 'Power is still high even though lights are off')
    .replace(/có thiết bị nào đang bật không\?/gi, isZh ? '是否还有其他设备在运行？' : 'is another device still on?')
    .replace(/Đèn đã tắt\s*[—–-]\s*điện tiêu thụ thấp/gi, isZh ? '灯已关闭 - 低功耗' : 'Lights are off — low power consumption')
    .replace(/Điện đang cao hơn mức thường/gi, isZh ? '当前功耗高于平时' : 'Power is higher than usual')
    .replace(/đang dùng/gi, isZh ? '当前用电' : 'now using')
    .replace(/thay vì/gi, isZh ? '而不是' : 'instead of')
    .replace(/như thường lệ/gi, isZh ? '常规水平' : 'as usual')
    .replace(/Đèn\s*(\d+)/gi, isZh ? '灯 $1' : 'Light $1')
    .replace(/Tất cả đèn/gi, isZh ? '所有灯' : 'All lights')
    .replace(/Công suất cao, nên kiểm tra thiết bị tiêu thụ/gi, isZh ? '功率高，应检查耗电设备' : 'High power, please check power-consuming devices')
    .replace(/Có tải điện nền bất thường/gi, isZh ? '存在异常的待机电流' : 'Abnormal standby current exists')
    .replace(/Nên tắt bớt đèn khi không sử dụng/gi, isZh ? '不使用时应关闭部分灯' : 'Should turn off some lights when not in use')
    .replace(/Kiểm tra thiết bị tiêu thụ/gi, isZh ? '检查耗电设备' : 'Check power-consuming devices')
    .replace(/ngân sách tháng này lại rủng rỉnh thêm một chút/gi, isZh ? '本月预算又充足了一点' : 'your monthly budget is a bit fuller')
    .replace(/tiết kiệm thêm được/gi, isZh ? '额外节省了' : 'additionally saved')
    .replace(/mỗi ngày/gi, isZh ? '每天' : 'per day')
    .replace(/mỗi giờ/gi, isZh ? '每小时' : 'per hour')
    .replace(/tốn khoảng/gi, isZh ? '花费约' : 'costs about')
    .replace(/Hãy tắt ngay/gi, isZh ? '请立即关闭' : 'Please turn off immediately')
    .replace(/bình nóng lạnh/gi, isZh ? '热水器' : 'water heater')
    .replace(/thiết bị nặng/gi, isZh ? '大功率设备' : 'high-power device')
    .replace(/nếu không dùng/gi, isZh ? '如果不使用' : 'if not in use')
    .replace(/Bật đèn hợp lý sẽ giúp tiết kiệm điện/gi, isZh ? '合理开灯将节省电力' : 'Using lights wisely will save electricity')
    .replace(/đừng quên tắt khi không dùng/gi, isZh ? '不用时请记得关闭' : 'remember to turn off when not in use')
    .replace(/Nhớ tận dụng ánh sáng tự nhiên/gi, isZh ? '记得利用自然光' : 'Remember to use natural light')
    .replace(/Trung bình công suất/gi, isZh ? '平均功率' : 'Average power')
    .replace(/hôm nay/gi, isZh ? '今天' : 'today')
    .replace(/mW/gi, isZh ? 'mW' : 'mW')
    .replace(/W/gi, isZh ? 'W' : 'W')
    .replace(/nếu được nhé!/gi, isZh ? '！' : '!')
    .replace(/nếu được nhé/gi, isZh ? '' : '')
    .replace(/per day/gi, isZh ? '每天' : 'per day')
    .replace(/per hour/gi, isZh ? '每小时' : 'per hour')
    .replace(/additionally saved/gi, isZh ? '额外节省了' : 'additionally saved')
    .replace(/your monthly budget is a bit fuller|ngân sách tháng này lại rủng rỉnh thêm một chút/gi, isZh ? '你的月度预算又充足了一点' : 'your monthly budget is a bit fuller')
    .replace(/Remember to use natural light|Nhớ tận dụng ánh sáng tự nhiên/gi, isZh ? '记得利用自然光' : 'Remember to use natural light')
    .replace(/Using lights Wisely Will save electricity, remember to turn off When not in use|Bật đèn hợp lý sẽ giúp tiết kiệm điện, đừng quên tắt khi không dùng/gi, isZh ? '合理使用灯会节省电力，不使用时请记得关闭' : 'Using lights wisely will save electricity, remember to turn off when not in use')
    .replace(/Tương đương equivalent to costs about|equivalent to costs about/gi, isZh ? '相当于花费约' : 'equivalent to costs about')
    .replace(/nếu giữ liên tục|if kept on/gi, isZh ? '如果保持开启' : 'if kept on')
    .replace(/Suggestion: Turn on both lights only when necessary to optimize power usage|Gợi ý: bật đồng thời 2 đèn chỉ khi cần thiết để tối ưu điện năng/gi, isZh ? '建议：仅在必要时同时打开 2 盏灯以优化用电' : 'Suggestion: Turn on both lights only when necessary to optimize power usage')
    .replace(/If lighting is sufficient, you can turn off one light to reduce consumption|Nếu độ sáng đã đủ, bạn có thể tắt bớt một đèn để giảm tiêu thụ/gi, isZh ? '如果光线充足，可以关闭一盏灯以降低消耗' : 'If lighting is sufficient, you can turn off one light to reduce consumption')
    .replace(/Prioritize reducing power immediately!|Ưu tiên giảm công suất lập tức!/gi, isZh ? '立即优先降低功率！' : 'Prioritize reducing power immediately!')
    .replace(/Please turn off water heater or high-power devices immediately if not in use!/gi, isZh ? '请立即关闭热水器或大功率设备（如果不使用）！' : 'Please turn off water heater or high-power devices immediately if not in use!')
    .replace(/Phát hiện bật Light (\d+)\./gi, isZh ? '检测到 Light $1 打开。' : 'Detected Light $1 turned on.')
    .replace(/Quá chuẩn!\s*Đêm qua|Perfect! Last night/gi, isZh ? '完美！昨晚' : 'Perfect! Last night')
    .replace(/Thật tuyệt!\s*Light (\d+) vừa tắt|Great! Light $1 just turned off/gi, isZh ? '很棒！Light $1 刚关闭' : 'Great! Light $1 just turned off')
    .replace(/tiết k?i?ệm được khoảng/gi, isZh ? '帮你每天省约' : 'helps you save about')
    .replace(/Light (\d+) vừa bật — làm tăng tải thêm/gi, isZh ? 'Light $1 刚打开 - 负载增加' : 'Light $1 just turned on — load increased by')
    .replace(/Sẽ tốn thêm tầm\s*([\d.]+)đ\/ngày/gi, isZh ? '每天将花费约 $1 元' : 'will cost about $1 yuan/day')
    .replace(/additionally saved/gi, isZh ? '额外节省了' : 'additionally saved')
    .replace(/your monthly budget is a bit fuller/gi, isZh ? '你的月度预算又充足了一点' : 'your monthly budget is a bit fuller')
    .replace(/Remember to use natural light\s*!?\s*$/gi, isZh ? '记得利用自然光！' : 'Remember to use natural light!')
    .replace(/Trung bình công suất/gi, isZh ? '平均功率' : 'Average power')
    .replace(/hôm nay/gi, isZh ? '今天' : 'today')
    .replace(/mW/gi, isZh ? 'mW' : 'mW')
    .replace(/W/gi, isZh ? 'W' : 'W')
    .replace(/nếu được nhé!/gi, isZh ? '！' : '!')
    .replace(/nếu được nhé/gi, isZh ? '' : '')
    .replace(/rồi!/gi, isZh ? '！' : '!')
    .replace(/rồi/gi, isZh ? '' : '')
    .replace(/Khuya rồi, nếu không cần thiết có thể tắt bớt đèn để giảm tiêu thụ nền ban đêm/gi, isZh ? '深夜了，如果不必要可以关掉一盏灯以减少夜间底噪功耗' : 'It is late, if not necessary, you can turn off some lights to reduce nighttime standby consumption')
    .replace(/Gợi ý ban đêm: ưu tiên dùng ít đèn hơn để tiết kiệm điện và tăng tuổi thọ thiết bị/gi, isZh ? '夜间建议：优先使用较少的灯光以省电并增加设备寿命' : 'Nighttime suggestion: prioritize using fewer lights to save electricity and increase device lifespan')
    .replace(/Giờ cao điểm: đang bật cả 2 đèn, nên giảm bớt nếu không cần để tiết kiệm chi phí/gi, isZh ? '高峰时段：两盏灯都亮着，如果不必要请减少以节省成本' : 'Peak hours: both lights are on, reduce if not needed to save costs')
    .replace(/Khung giờ tối thường tải cao, có thể tắt bớt 1 đèn để giảm công suất tức thời/gi, isZh ? '晚上通常负载较高，可以关掉一盏灯以减少即时功率' : 'Evening hours usually have high load, consider turning off one light to reduce instant power')
    .replace(/Gợi ý:\s*bật đồng thời 2 đèn chỉ khi cần thiết để tối ưu điện năng/gi, isZh ? '建议：仅在必要时同时打开 2 盏灯以优化用电' : 'Suggestion: Turn on both lights only when necessary to optimize power usage');
}
