// 課本冊次顯示字串（例如「翰林三上」），LessonDashboard／ModulePage 麵包屑共用，
// 不各自重寫一份，避免顯示不一致。
const CN_NUM = ['', '一', '二', '三', '四', '五', '六'];

export function volumeLabel(v) {
  return `${v.publisher || ''}${CN_NUM[v.grade] || v.grade}${v.term || ''}`;
}
