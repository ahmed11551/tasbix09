// Статические константы (labels, mappings) - не моки, а UI константы

export const categoryLabels: Record<string, string> = {
  general: 'Общее',
  surah: 'Сура',
  ayah: 'Аят',
  dua: 'Дуа',
  azkar: 'Азкары',
  names99: '99 Имён',
  salawat: 'Салаваты',
  kalimat: 'Калимы',
};

export const prayerLabels: Record<string, string> = {
  fajr: 'Фаджр',
  dhuhr: 'Зухр',
  asr: 'Аср',
  maghrib: 'Магриб',
  isha: 'Иша',
  none: 'Без привязки',
};

export const goalCategoryLabels: Record<string, string> = {
  general: 'Общее',
  surah: 'Сура',
  ayah: 'Аят',
  dua: 'Дуа',
  azkar: 'Азкары',
  names99: '99 Имён Аллаха',
  salawat: 'Салаваты',
  kalimat: 'Калимы',
};

// Маппинг категорий привычек в категории целей
export const habitCategoryToGoalCategory: Record<string, string> = {
  namaz: 'general', // Намаз -> Общее (или можно создать отдельную категорию для намазов)
  quran: 'surah', // Коран -> Сура
  dhikr: 'azkar', // Зикр -> Азкары
  sadaqa: 'general', // Садака -> Общее
  knowledge: 'general', // Знания -> Общее
  fasting: 'general', // Пост -> Общее
  etiquette: 'general', // Этикет -> Общее
};

