import { Language } from '@/i18n';

export function localizeAiText(text: string, language: Language) {
  if (!text || language === 'vi') return text;

  const source = text.trim();
  const isZh = language === 'zh';

  // --- 1. FULL SENTENCE PATTERNS (High Priority & Flexible) ---

  // Light turned off with thanks message
  const lightOffThankYou = source.match(/^(?:Light|Đèn|Phòng khách|Ban công|Living Room|Balcony).*?(?:đã tắt|vừa tắt)\.\s*Hành động nhỏ tiết kiệm lớn.*?$/i);
  if (lightOffThankYou) {
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : 
                 (source.includes('Ban công') || source.includes('Balcony')) ? (isZh ? '阳台灯' : 'Balcony Light') : 
                 (isZh ? `灯` : `Light`);
    return isZh
      ? `${name} 已关闭。小举措，大节省，系统感谢你！`
      : `${name} has been turned off. Small actions, big savings, the system thanks you!`;
  }

  // Hybrid Saving Message (Thật tuyệt!) - Very flexible match
  const hybridSavingMessage = source.match(/^Thật tuyệt!.*?(?:vừa tắt|just turned off).*?(?:tiết kiệm|save).*?([\d.,]+)\s*đ.*?$/i);
  if (hybridSavingMessage) {
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : 
                 (source.includes('Ban công') || source.includes('Balcony')) ? (isZh ? '阳台灯' : 'Balcony Light') : 
                 (isZh ? `灯` : `Light`);
    return isZh
      ? `很棒！${name} 刚关闭，帮你每天省约 ${hybridSavingMessage[1]} VND。`
      : `Great! ${name} just turned off, helps you save about ${hybridSavingMessage[1]} VND per day.`;
  }

  // Hybrid Cost Message (Vừa bật) - Supports parentheses format
  const hybridCostMessage = source.match(/^(?:Light|Đèn|Phòng khách|Ban công|Living Room|Balcony).*?(?:vừa bật|just turned on).*?([\d.]+)\s*W\s*\(tốn\s*~?([\d.,]+)\s*đ.*?$/i);
  if (hybridCostMessage) {
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : 
                 (source.includes('Ban công') || source.includes('Balcony')) ? (isZh ? '阳台灯' : 'Balcony Light') : 
                 (isZh ? `灯` : `Light`);
    return isZh
      ? `${name} 刚打开 - 负载增加 ${hybridCostMessage[1]} W（每天约耗电 ${hybridCostMessage[2]} VND）。`
      : `${name} just turned on — load increased by ${hybridCostMessage[1]} W (costs ~${hybridCostMessage[2]} VND/day).`;
  }

  // Hybrid Budget Message (Quá chuẩn!)
  const hybridBudgetMessage = source.match(/^Quá chuẩn!.*?(?:vừa tắt|đã tắt|just turned off).*?(?:tiết kiệm|saved).*?([\d.,]+)\s*đ.*?$/i);
  if (hybridBudgetMessage) {
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : 
                 (source.includes('Ban công') || source.includes('Balcony')) ? (isZh ? '阳台灯' : 'Balcony Light') : 
                 (isZh ? `灯` : `Light`);
    return isZh
      ? `完美！你刚才关闭了 ${name}，又为家里省了 ${hybridBudgetMessage[1]} VND。`
      : `Perfect! You just turned off ${name}, additionally saved ${hybridBudgetMessage[1]} VND for your family.`;
  }

  // Cost Warning with Icon
  const costWarningWithIcon = source.match(/^.*?⚠️.*?Cảnh báo chi phí.*?([\d.,]+)đ.*?$/i);
  if (costWarningWithIcon) {
    return isZh
      ? `⚠️ 费用警告：你正在使用功率非常大的设备，每小时消耗约 ${costWarningWithIcon[1]} VND。如果不是真的必要，请关闭以省电！`
      : `⚠️ Cost Warning: You are using a very high-power device, consuming about ${costWarningWithIcon[1]} VND per hour. If not absolutely necessary, please turn it off to save electricity!`;
  }

  // Standby Warning with Icon
  const standbyWarning = source.match(/^.*?⚠️.*?Cảnh báo: Tiền điện tháng này.*?([\d.,]+)đ.*?$/i);
  if (standbyWarning) {
    return isZh
      ? `⚠️ 警告：本月电费有大幅上涨的风险！系统检测到后台设备每月消耗你约 ${standbyWarning[1]} VND。请检查并断开不使用的设备电源！`
      : `⚠️ Warning: This month's electricity bill is at risk of increasing sharply! The system detected background devices costing you about ${standbyWarning[1]} VND per month. Please check and unplug unused devices!`;
  }

  // Abnormal sudden power consumption
  if (source.includes('Điện tiêu thụ đột ngột bất thường') || source.includes('Abnormal sudden power consumption')) {
    return isZh
      ? '🚨 检测到异常突增的用电量 - 请检查家中的设备'
      : '🚨 Abnormal sudden power consumption detected — please check devices in your home';
  }

  // Current Consumption Change
  const changedCurrent = source.match(/^(?:Light|Đèn|Phòng khách|Ban công|Living Room|Balcony).*?(?:thay đổi|changed).*?(?:điện tiêu thụ hiện tại|current power).*?([\d.]+)\s*W$/i);
  if (changedCurrent) {
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : 
                 (source.includes('Ban công') || source.includes('Balcony')) ? (isZh ? '阳台灯' : 'Balcony Light') : 
                 (isZh ? `灯` : `Light`);
    return isZh
      ? `${name} 状态已变化 - 当前功耗：${changedCurrent[1]} W`
      : `${name} status changed — current power consumption: ${changedCurrent[1]} W`;
  }

  // Light turned on — power increased
  const lightOnPower = source.match(/^(?:Light|Đèn|Phòng khách|Ban công|Living Room|Balcony).*?(?:vừa bật|just turned on).*?(?:điện tăng|increased).*?([\d.]+)\s*W.*?([\d.]+)\s*W\)$/i);
  if (lightOnPower) {
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : 
                 (source.includes('Ban công') || source.includes('Balcony')) ? (isZh ? '阳台灯' : 'Balcony Light') : 
                 (isZh ? `灯` : `Light`);
    return isZh
      ? `${name} 刚刚打开 - 功率增加 ${lightOnPower[1]} W（当前用电：${lightOnPower[2]} W）`
      : `${name} just turned on — power increased by ${lightOnPower[1]} W (now using: ${lightOnPower[2]} W)`;
  }

  const lightOffPower = source.match(/^(?:Light|Đèn|Phòng khách|Ban công|Living Room|Balcony).*?(?:vừa tắt|just turned off).*?(?:điện giảm|decreased).*?([\d.]+)\s*W.*?([\d.]+)\s*W\)$/i);
  if (lightOffPower) {
    return isZh
      ? `灯刚刚关闭 - 功率下降 ${lightOffPower[1]} W（当前待机功耗：${lightOffPower[2]} W）`
      : `Lights just turned off — power decreased by ${lightOffPower[1]} W (standby power: ${lightOffPower[2]} W)`;
  }

  if (source.includes('điện tiêu thụ thấp') || source.includes('low power consumption')) {
    return isZh
      ? '✅ 功耗处于低水平（正常待机）'
      : '✅ Power consumption is at a low level (normal standby)';
  }
  const longUsage = source.match(/^(Nhận xét|Cảnh báo|Khuyến nghị|Note|Warning|Recommendation):.*?(?:Phòng khách|Ban công|Living Room|Balcony).*?(\d+)\s*(?:tiếng|giờ|hours).*?$/i);
  if (longUsage) {
    const prefix = (source.includes('Nhận xét') || source.includes('Note')) ? (isZh ? '备注' : 'Note') : 
                   (source.includes('Cảnh báo') || source.includes('Warning')) ? (isZh ? '警告' : 'Warning') : (isZh ? '建议' : 'Recommendation');
    const name = (source.includes('Phòng khách') || source.includes('Living Room')) ? (isZh ? '客厅灯' : 'Living Room Light') : (isZh ? '阳台灯' : 'Balcony Light');
    return isZh
      ? `${prefix}：根据使用情况，你已开启 ${name} 超过 ${longUsage[2]} 小时。如果不必要，请关闭以省电。`
      : `${prefix}: Based on usage, you have turned on ${name} for more than ${longUsage[2]} hours. Consider turning it off to save energy.`;
  }

  // Optimization Suggestions
  if (source.includes('Gợi ý tối ưu') || source.includes('Optimization suggestion')) {
    return isZh
      ? '💡 优化建议：你同时开启了客厅和阳台灯，如果亮度足够可以关闭一盏。'
      : '💡 Optimization suggestion: You are using both Living Room and Balcony lights, consider turning one off if brightness is sufficient.';
  }

  // Peak Hour Tip
  if (source.includes('Giờ cao điểm tối') || source.includes('Evening peak hours')) {
    return isZh
      ? '⏰ 晚上高峰时段：你开启了两盏灯，如果不需要请关闭一盏以节省成本。'
      : '⏰ Evening peak hours: you have both lights on, please turn one off if not needed to save costs.';
  }

  // --- 2. PARTIAL REPLACEMENTS (Fallback) ---
  return source
    .replace(/Chưa đủ dữ liệu để phân tích/gi, isZh ? '数据不足以进行分析' : 'Insufficient data for analysis')
    .replace(/Mức tiêu thụ điện ổn định/gi, isZh ? '电力消耗水平稳定' : 'Power consumption stable')
    .replace(/đang bật\s*[—–-]\s*mức điện bình thường/gi, isZh ? '已开启 - 功耗水平正常' : 'is on — normal power level')
    .replace(/đang bật\s*[—–-]\s*điện tiêu thụ/gi, isZh ? '已开启 - 当前功耗：' : 'is on — power consumption:')
    .replace(/Phòng khách/gi, isZh ? '客厅' : 'Living Room')
    .replace(/Ban công/gi, isZh ? '阳台' : 'Balcony')
    .replace(/tiết kiệm thêm được/gi, isZh ? '额外节省了' : 'additionally saved')
    .replace(/giúp bạn tiết kiệm được khoảng/gi, isZh ? '帮你每天省约' : 'helps you save about')
    .replace(/mỗi ngày/gi, isZh ? '每天' : 'per day')
    .replace(/mỗi giờ/gi, isZh ? '每小时' : 'per hour')
    .replace(/tốn khoảng/gi, isZh ? '花费约' : 'costs about')
    .replace(/cho gia đình/gi, isZh ? '为家里' : 'for your family')
    .replace(/([\d.,]+),\d{3}đ/g, '$1đ'); // Clean decimals like 1.002,888đ
}
