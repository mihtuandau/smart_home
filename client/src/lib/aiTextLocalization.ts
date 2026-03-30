import { Language } from '@/i18n';

export function localizeAiText(text: string, language: Language) {
  if (!text || language === 'vi') return text;

  const source = text.trim();
  const isZh = language === 'zh';

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

  return source
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
    .replace(/Tất cả đèn/gi, isZh ? '所有灯' : 'All lights');
}
