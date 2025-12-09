// Переводы для всех языков приложения

export type Language = 'ru' | 'en' | 'ar';

export interface Translations {
  // Общие
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    back: string;
    next: string;
    done: string;
    yes: string;
    no: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    cannotUndo: string;
  };

  // Навигация
  navigation: {
    tasbih: string;
    goals: string;
    zikry: string;
    reports: string;
    settings: string;
  };

  // Настройки
  settings: {
    title: string;
    profile: string;
    app: string;
    localization: string;
    support: string;
    language: string;
    transcription: string;
    darkMode: string;
    notifications: string;
    hapticFeedback: string;
    soundEffects: string;
    myProfile: string;
    name: string;
    timezone: string;
    madhab: string;
    help: string;
    feedback: string;
    privacy: string;
    cyrillic: string;
    latin: string;
    russian: string;
    english: string;
    arabic: string;
  };

  // Тасбих
  tasbih: {
    title: string;
    selectDhikr: string;
    quickSelect: string;
    rounds: string;
    count: string;
    reset: string;
    undo: string;
    complete: string;
    transcription: string;
    translation: string;
    audio: string;
    settings: string;
    transcriptionType: string;
    goalCompleted: string;
    sessionResumed: string;
    dhikrSaved: string;
    errorCreatingSession: string;
    errorResumingSession: string;
    noActionToUndo: string;
    fullReset: string;
    resetCounter: string;
    goal: string;
    leftOf: string;
    counter: string;
    removeGoal: string;
    goalCompletedMessage: string;
    autoInterval: string;
    stopAutoTap: string;
    startAutoTap: string;
    from1To60Sec: string;
    goalColon: string;
    repeatCount: string;
    learned: string;
    repeat: string;
    markLearned: string;
  };

  // Цели
  goals: {
    title: string;
    activeGoals: string;
    completedGoals: string;
    createGoal: string;
    createHabit: string;
    editGoal: string;
    deleteGoal: string;
    pauseGoal: string;
    resumeGoal: string;
    category: string;
    target: string;
    progress: string;
    deadline: string;
    dailyPlan: string;
    daysLeft: string;
    goalCreated: string;
    goalUpdated: string;
    goalDeleted: string;
    goalPaused: string;
    goalResumed: string;
    goalLimitReached: string;
    errorCreatingGoal: string;
    errorUpdatingGoal: string;
    errorDeletingGoal: string;
    confirmDeleteGoal: string;
    confirmDeleteHabit: string;
    confirmDeleteTask: string;
    confirmDeleteSession: string;
    cannotUndo: string;
  };

  // Зикры
  zikry: {
    title: string;
    categories: string;
    all: string;
    today: string;
    popular: string;
    search: string;
    startTasbih: string;
    viewDetails: string;
    copy: string;
    share: string;
    bookmark: string;
  };

  // Отчеты
  reports: {
    title: string;
    stats: string;
    streaks: string;
    badges: string;
    activity: string;
    today: string;
    achievements: string;
    history: string;
    overallProgress: string;
    completed: string;
    for: string;
    week: string;
    month: string;
    quarter: string;
    year: string;
    streak: string;
    daysInRow: string;
    pending: string;
    everythingDone: string;
    actions: string;
    missed: string;
    forPeriod: string;
    dynamics: string;
    executed: string;
    percentCompletion: string;
    whatToDoNow: string;
    completeTodayHabits: string;
    left: string;
    allHabitsDone: string;
    greatWork: string;
    overdueTasks: string;
    tasksRequireAttention: string;
    task: string;
    recoverHabits: string;
    habit: string;
    habits: string;
    streakGrowing: string;
    daysInPeriod: string;
    allUnderControl: string;
    noTasksRequiringAttention: string;
    missedHabits: string;
    noMissedHabits: string;
    mark: string;
    pendingActions: string;
    overdueTasksCount: string;
    todayTasks: string;
    tasksCount: string;
    uncompletedHabits: string;
    uncompletedHabitsCount: string;
    todayHabits: string;
    noTodayHabits: string;
    awaiting: string;
    salawatAfterPrayer: string;
    activeGoals: string;
    totalTasks: string;
    totalGoals: string;
    deadline: string;
    all: string;
    tasksToday: string;
    noTasksToday: string;
    subtasks: string;
    recommendation: string;
    receivedBadges: string;
    lockedBadges: string;
  };

  // Категории
  categories: {
    general: string;
    surah: string;
    ayah: string;
    dua: string;
    azkar: string;
    names99: string;
    salawat: string;
    kalimat: string;
  };

  // Намазы
  prayers: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    none: string;
  };

  // Привычки
  habits: {
    createHabit: string;
    editHabit: string;
    deleteHabit: string;
    habitCreated: string;
    habitUpdated: string;
    habitDeleted: string;
    errorCreatingHabit: string;
    errorUpdatingHabit: string;
    errorDeletingHabit: string;
  };

  // Задачи
  tasks: {
    createTask: string;
    editTask: string;
    deleteTask: string;
    taskCreated: string;
    taskUpdated: string;
    taskDeleted: string;
    errorCreatingTask: string;
    errorUpdatingTask: string;
    errorDeletingTask: string;
  };

  // AI помощник
  ai: {
    assistant: string;
    greeting: string;
    placeholder: string;
    send: string;
    listening: string;
    notAvailable: string;
  };

  // Qaza калькулятор
  qaza: {
    title: string;
    calculate: string;
    birthDate: string;
    gender: string;
    male: string;
    female: string;
    bulughAge: string;
    prayerStartDate: string;
    travelDays: string;
    haidDays: string;
    childbirthCount: string;
  };
}

const translations: Record<Language, Translations> = {
  ru: {
    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      create: 'Создать',
      close: 'Закрыть',
      back: 'Назад',
      next: 'Далее',
      done: 'Готово',
      yes: 'Да',
      no: 'Нет',
      search: 'Поиск',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      cannotUndo: 'Это действие нельзя отменить',
    },
    navigation: {
      tasbih: 'Тасбих',
      goals: 'Цели',
      zikry: 'Зикры',
      reports: 'Отчёты',
      settings: 'Настройки',
    },
    settings: {
      title: 'Настройки',
      profile: 'Профиль',
      app: 'Приложение',
      localization: 'Локализация',
      support: 'Поддержка',
      language: 'Язык',
      transcription: 'Транскрипция',
      darkMode: 'Тёмная тема',
      notifications: 'Умные уведомления',
      hapticFeedback: 'Вибрация при тапе',
      soundEffects: 'Звуковые эффекты',
      myProfile: 'Мой профиль',
      name: 'Имя',
      timezone: 'Часовой пояс',
      madhab: 'Мазхаб',
      help: 'Помощь и FAQ',
      feedback: 'Обратная связь',
      privacy: 'Политика конфиденциальности',
      cyrillic: 'Кириллица',
      latin: 'Латиница',
      russian: 'Русский',
      english: 'English',
      arabic: 'العربية',
    },
    tasbih: {
      title: 'Тасбих',
      selectDhikr: 'Выберите зикр...',
      quickSelect: 'Быстрый выбор',
      rounds: 'Кругов',
      count: 'Счёт',
      reset: 'Сбросить',
      undo: 'Отменить',
      complete: 'Завершить',
      transcription: 'Транскрипция',
      translation: 'Перевод',
      audio: 'Воспроизведение',
      settings: 'Настройки',
      transcriptionType: 'Тип транскрипции',
      goalCompleted: 'Цель достигнута!',
      sessionResumed: 'Сессия возобновлена',
      dhikrSaved: 'Зикры сохранены',
      errorCreatingSession: 'Не удалось создать сессию',
      errorResumingSession: 'Не удалось возобновить сессию',
      noActionToUndo: 'Нет действий для отмены',
      actionUndone: 'Действие отменено',
      rollbackBy: 'Откат на',
      fullReset: 'Сбросить всё',
      resetCounter: 'Сбросить счетчик',
      goal: 'Цель',
      leftOf: 'осталось из',
      counter: 'Счетчик',
      removeGoal: 'Убрать цель',
      goalCompletedMessage: 'Машааллах! Цель достигнута!',
      autoInterval: 'Задать автоинтервал (сек)',
      stopAutoTap: 'Остановить авто-тап',
      startAutoTap: 'Запустить авто-тап',
      from1To60Sec: 'от 1 до 60 сек',
      autoTapMessage: 'Тап будет нажиматься автоматически каждые',
      second: 'секунду',
      seconds2: 'секунды',
      seconds: 'секунд',
      goalColon: 'Цель:',
      repeatCount: 'Количество повторов',
      learned: 'Выучено!',
      repeat: 'Повторил',
      markLearned: 'Выучил',
    },
    goals: {
      title: 'Цели',
      activeGoals: 'Активные цели',
      completedGoals: 'Завершённые цели',
      createGoal: 'Создать цель',
      createHabit: 'Создать привычку',
      editGoal: 'Редактировать цель',
      deleteGoal: 'Удалить цель',
      pauseGoal: 'Приостановить цель',
      resumeGoal: 'Возобновить цель',
      category: 'Категория',
      target: 'Цель',
      progress: 'Прогресс',
      deadline: 'Дедлайн',
      dailyPlan: 'Ежедневный план',
      daysLeft: 'Осталось дней',
      goalCreated: 'Цель создана',
      goalUpdated: 'Цель обновлена',
      goalDeleted: 'Цель удалена',
      goalPaused: 'Цель приостановлена',
      goalResumed: 'Цель возобновлена',
      goalLimitReached: 'Достигнут лимит целей',
      errorCreatingGoal: 'Не удалось сохранить цель',
      errorUpdatingGoal: 'Не удалось обновить цель',
      errorDeletingGoal: 'Не удалось удалить цель',
      confirmDeleteGoal: 'Удалить цель?',
      confirmDeleteHabit: 'Удалить привычку?',
      confirmDeleteTask: 'Удалить задачу?',
      confirmDeleteSession: 'Удалить незавершенную сессию?',
      cannotUndo: 'Отмена доступна только в течение 5 секунд после действия',
    },
    zikry: {
      title: 'Зикры',
      categories: 'Категории',
      all: 'Все',
      today: 'Сегодня',
      popular: 'Популярные',
      search: 'Поиск',
      startTasbih: 'Начать тасбих',
      viewDetails: 'Подробнее',
      copy: 'Копировать',
      share: 'Поделиться',
      bookmark: 'Добавить в закладки',
        copied: 'Скопировано',
        copiedForShare: 'Скопировано для отправки',
        translation: 'Перевод',
      source: 'Источник',
      benefit: 'Достоинство',
    },
    reports: {
      title: 'Отчёты',
      stats: 'Статистика',
      streaks: 'Серии',
      badges: 'Бейджи',
      activity: 'Активность',
      today: 'Сегодня',
      achievements: 'Достижения',
      history: 'История',
      overallProgress: 'Общий прогресс',
      completed: 'выполнено',
      for: 'за',
      week: 'неделю',
      month: 'месяц',
      quarter: 'квартал',
      year: 'год',
      streak: 'Серия',
      daysInRow: 'дней подряд',
      pending: 'Ожидает',
      everythingDone: 'всё выполнено',
      actions: 'действий',
      missed: 'Пропущено',
      forPeriod: 'за период',
      dynamics: 'Динамика',
      executed: 'Выполнено',
      percentCompletion: '% выполнения',
      whatToDoNow: 'Что делать сейчас',
      completeTodayHabits: 'Завершите сегодняшние привычки',
      left: 'Осталось',
      allHabitsDone: 'Все привычки на сегодня выполнены!',
      greatWork: 'Отличная работа, продолжайте!',
      overdueTasks: 'Просроченные задачи',
      tasksRequireAttention: 'задач требуют',
      task: 'задача',
      recoverHabits: 'Восстановите',
      habit: 'привычку',
      habits: 'привычек',
      streakGrowing: 'Серия растет!',
      daysInPeriod: 'дней за период',
      allUnderControl: 'Все под контролем!',
      noTasksRequiringAttention: 'Нет задач, требующих немедленного внимания',
      missedHabits: 'Пропущенные привычки',
      noMissedHabits: 'Нет пропущенных привычек',
      mark: 'Отметить',
      pendingActions: 'Ожидающие действия',
      overdueTasksCount: 'Просроченные задачи',
      todayTasks: 'Задачи на сегодня',
      tasksCount: 'задач',
      uncompletedHabits: 'Невыполненные привычки',
      uncompletedHabitsCount: 'невыполненных привычек',
      todayHabits: 'Привычки на сегодня',
      noTodayHabits: 'Нет привычек на сегодня',
      awaiting: 'Ожидает',
      salawatAfterPrayer: 'Салаваты после намаза',
      activeGoals: 'Активные цели',
      totalTasks: 'Всего задач',
      totalGoals: 'Всего целей',
      deadline: 'Срок',
      all: 'Все',
      tasksToday: 'Задачи на сегодня',
      noTasksToday: 'Нет задач на сегодня',
      subtasks: 'подзадач',
      recommendation: 'Рекомендация',
      receivedBadges: 'Полученные бейджи',
      lockedBadges: 'Заблокированные бейджи',
      inProgress: 'В процессе',
      completedGoals: 'Выполненные цели',
    },
    categories: {
      general: 'Общее',
      surah: 'Сура',
      ayah: 'Аят',
      dua: 'Дуа',
      azkar: 'Азкары',
      names99: '99 Имён',
      salawat: 'Салаваты',
      kalimat: 'Калимы',
    },
    prayers: {
      fajr: 'Фаджр',
      dhuhr: 'Зухр',
      asr: 'Аср',
      maghrib: 'Магриб',
      isha: 'Иша',
      none: 'Без привязки',
    },
    habits: {
      createHabit: 'Создать привычку',
      editHabit: 'Редактировать привычку',
      deleteHabit: 'Удалить привычку',
      habitCreated: 'Привычка создана',
      habitUpdated: 'Привычка обновлена',
      habitDeleted: 'Привычка удалена',
      errorCreatingHabit: 'Не удалось сохранить привычку',
      errorUpdatingHabit: 'Не удалось обновить привычку',
      errorDeletingHabit: 'Не удалось удалить привычку',
    },
    tasks: {
      createTask: 'Создать задачу',
      editTask: 'Редактировать задачу',
      deleteTask: 'Удалить задачу',
      taskCreated: 'Задача создана',
      taskUpdated: 'Задача обновлена',
      taskDeleted: 'Задача удалена',
      errorCreatingTask: 'Не удалось создать задачу',
      errorUpdatingTask: 'Не удалось обновить задачу',
      errorDeletingTask: 'Не удалось удалить задачу',
    },
    ai: {
      assistant: 'AI Помощник',
      greeting: 'Привет! Я AI-помощник. Я могу помочь вам создать задачи или привычки. Просто опишите, что вы хотите сделать!',
      placeholder: 'Введите ваш запрос...',
      send: 'Отправить',
      listening: 'Слушаю...',
      notAvailable: 'AI-помощник временно недоступен',
    },
    qaza: {
      title: 'Калькулятор каза',
      calculate: 'Рассчитать',
      birthDate: 'Дата рождения',
      gender: 'Пол',
      male: 'Мужской',
      female: 'Женский',
      bulughAge: 'Возраст совершеннолетия',
      prayerStartDate: 'Дата начала молитв',
      travelDays: 'Дней в пути',
      haidDays: 'Дней хайда в месяц',
      childbirthCount: 'Количество родов',
    },
  },

  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      yes: 'Yes',
      no: 'No',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cannotUndo: 'This action cannot be undone',
    },
    navigation: {
      tasbih: 'Tasbih',
      goals: 'Goals',
      zikry: 'Zikr',
      reports: 'Reports',
      settings: 'Settings',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      app: 'Application',
      localization: 'Localization',
      support: 'Support',
      language: 'Language',
      transcription: 'Transcription',
      darkMode: 'Dark Mode',
      notifications: 'Smart Notifications',
      hapticFeedback: 'Haptic Feedback',
      soundEffects: 'Sound Effects',
      myProfile: 'My Profile',
      name: 'Name',
      timezone: 'Timezone',
      madhab: 'Madhab',
      help: 'Help & FAQ',
      feedback: 'Feedback',
      privacy: 'Privacy Policy',
      cyrillic: 'Cyrillic',
      latin: 'Latin',
      russian: 'Russian',
      english: 'English',
      arabic: 'Arabic',
    },
    tasbih: {
      title: 'Tasbih',
      selectDhikr: 'Select dhikr...',
      quickSelect: 'Quick Select',
      rounds: 'Rounds',
      count: 'Count',
      reset: 'Reset',
      undo: 'Undo',
      complete: 'Complete',
      transcription: 'Transcription',
      translation: 'Translation',
      audio: 'Playback',
      settings: 'Settings',
      transcriptionType: 'Transcription Type',
      goalCompleted: 'Goal Completed!',
      sessionResumed: 'Session Resumed',
      dhikrSaved: 'Dhikr Saved',
      errorCreatingSession: 'Failed to create session',
      errorResumingSession: 'Failed to resume session',
      noActionToUndo: 'No action to undo',
      fullReset: 'Reset All',
      resetCounter: 'Reset Counter',
      goal: 'Goal',
      rounds: 'rounds',
      leftOf: 'left of',
      counter: 'Counter',
      removeGoal: 'Remove Goal',
      goalCompletedMessage: 'MashaAllah! Goal Completed!',
      autoInterval: 'Set Auto Interval (sec)',
      stopAutoTap: 'Stop Auto Tap',
      startAutoTap: 'Start Auto Tap',
      from1To60Sec: 'from 1 to 60 sec',
      autoTapMessage: 'Tap will be pressed automatically every',
      second: 'second',
      seconds2: 'seconds',
      seconds: 'seconds',
      goalColon: 'Goal:',
      repeatCount: 'Repeat Count',
      learned: 'Learned!',
      repeat: 'Repeat',
      markLearned: 'Mark as Learned',
    },
    goals: {
      title: 'Goals',
      activeGoals: 'Active Goals',
      completedGoals: 'Completed Goals',
      createGoal: 'Create Goal',
      createHabit: 'Create Habit',
      editGoal: 'Edit Goal',
      deleteGoal: 'Delete Goal',
      pauseGoal: 'Pause Goal',
      resumeGoal: 'Resume Goal',
      category: 'Category',
      target: 'Target',
      progress: 'Progress',
      deadline: 'Deadline',
      dailyPlan: 'Daily Plan',
      daysLeft: 'Days Left',
      goalCreated: 'Goal Created',
      goalUpdated: 'Goal Updated',
      goalDeleted: 'Goal Deleted',
      goalPaused: 'Goal Paused',
      goalResumed: 'Goal Resumed',
      goalLimitReached: 'Goal Limit Reached',
      errorCreatingGoal: 'Failed to save goal',
      errorUpdatingGoal: 'Failed to update goal',
      errorDeletingGoal: 'Failed to delete goal',
      confirmDeleteGoal: 'Delete goal?',
      confirmDeleteHabit: 'Delete habit?',
      confirmDeleteTask: 'Delete task?',
      confirmDeleteSession: 'Delete unfinished session?',
      cannotUndo: 'Undo is only available within 5 seconds of the action',
    },
    zikry: {
      title: 'Zikr',
      categories: 'Categories',
      all: 'All',
      today: 'Today',
      popular: 'Popular',
      search: 'Search',
      startTasbih: 'Start Tasbih',
      viewDetails: 'View Details',
      copy: 'Copy',
      share: 'Share',
      bookmark: 'Bookmark',
      copied: 'Copied',
      copiedForShare: 'Copied for sharing',
      translation: 'Translation',
      source: 'Source:',
      benefit: 'Benefit',
      todayDua: 'Today\'s Dua',
      favorites: 'Favorites',
      found: 'Found:',
      total: 'Total:',
      noFavorites: 'No Favorite Zikr',
      noFavoritesDescription: 'Click the heart icon on a zikr to add it to favorites',
    },
    reports: {
      title: 'Reports',
      stats: 'Statistics',
      streaks: 'Streaks',
      badges: 'Badges',
      activity: 'Activity',
      today: 'Today',
      achievements: 'Achievements',
      history: 'History',
      overallProgress: 'Overall Progress',
      completed: 'completed',
      for: 'for',
      week: 'week',
      month: 'month',
      quarter: 'quarter',
      year: 'year',
      streak: 'Streak',
      daysInRow: 'days in a row',
      pending: 'Pending',
      everythingDone: 'everything done',
      actions: 'actions',
      missed: 'Missed',
      forPeriod: 'for the period',
      dynamics: 'Dynamics',
      executed: 'Executed',
      percentCompletion: '% completion',
      whatToDoNow: 'What to do now',
      completeTodayHabits: 'Complete today\'s habits',
      left: 'Left',
      allHabitsDone: 'All habits for today are done!',
      greatWork: 'Great work, keep it up!',
      overdueTasks: 'Overdue tasks',
      tasksRequireAttention: 'tasks require',
      task: 'task',
      recoverHabits: 'Recover',
      habit: 'habit',
      habits: 'habits',
      streakGrowing: 'Streak growing!',
      daysInPeriod: 'days in the period',
      allUnderControl: 'Everything under control!',
      noTasksRequiringAttention: 'No tasks requiring immediate attention',
      missedHabits: 'Missed habits',
      noMissedHabits: 'No missed habits',
      mark: 'Mark',
      pendingActions: 'Pending actions',
      overdueTasksCount: 'Overdue tasks',
      todayTasks: 'Tasks for today',
      tasksCount: 'tasks',
      uncompletedHabits: 'Uncompleted habits',
      uncompletedHabitsCount: 'uncompleted habits',
      todayHabits: 'Habits for today',
      noTodayHabits: 'No habits for today',
      awaiting: 'Awaiting',
      salawatAfterPrayer: 'Salawat after prayer',
      activeGoals: 'Active Goals',
      totalTasks: 'Total tasks',
      totalGoals: 'Total goals',
      deadline: 'Deadline',
      all: 'All',
      tasksToday: 'Tasks for today',
      noTasksToday: 'No tasks for today',
      subtasks: 'subtasks',
      recommendation: 'Recommendation',
      receivedBadges: 'Received badges',
      lockedBadges: 'Locked badges',
      inProgress: 'In progress',
      completedGoals: 'Completed goals',
      loadMore: 'Load More',
    },
    categories: {
      general: 'General',
      surah: 'Surah',
      ayah: 'Ayah',
      dua: 'Dua',
      azkar: 'Azkar',
      names99: '99 Names',
      salawat: 'Salawat',
      kalimat: 'Kalima',
    },
    prayers: {
      fajr: 'Fajr',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
      none: 'Not linked',
    },
    habits: {
      createHabit: 'Create Habit',
      editHabit: 'Edit Habit',
      deleteHabit: 'Delete Habit',
      habitCreated: 'Habit Created',
      habitUpdated: 'Habit Updated',
      habitDeleted: 'Habit Deleted',
      errorCreatingHabit: 'Failed to save habit',
      errorUpdatingHabit: 'Failed to update habit',
      errorDeletingHabit: 'Failed to delete habit',
    },
    tasks: {
      createTask: 'Create Task',
      editTask: 'Edit Task',
      deleteTask: 'Delete Task',
      taskCreated: 'Task Created',
      taskUpdated: 'Task Updated',
      taskDeleted: 'Task Deleted',
      errorCreatingTask: 'Failed to create task',
      errorUpdatingTask: 'Failed to update task',
      errorDeletingTask: 'Failed to delete task',
    },
    ai: {
      assistant: 'AI Assistant',
      greeting: 'Hello! I am an AI assistant. I can help you create tasks or habits. Just describe what you want to do!',
      placeholder: 'Enter your request...',
      send: 'Send',
      listening: 'Listening...',
      notAvailable: 'AI assistant is temporarily unavailable',
    },
    qaza: {
      title: 'Qaza Calculator',
      calculate: 'Calculate',
      birthDate: 'Birth Date',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      bulughAge: 'Age of Maturity',
      prayerStartDate: 'Prayer Start Date',
      travelDays: 'Travel Days',
      haidDays: 'Haid Days per Month',
      childbirthCount: 'Number of Childbirths',
    },
  },

  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إنشاء',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      done: 'تم',
      yes: 'نعم',
      no: 'لا',
      search: 'بحث',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      cannotUndo: 'لا يمكن التراجع عن هذا الإجراء',
    },
    navigation: {
      tasbih: 'تسبيح',
      goals: 'الأهداف',
      zikry: 'الأذكار',
      reports: 'التقارير',
      settings: 'الإعدادات',
    },
    settings: {
      title: 'الإعدادات',
      profile: 'الملف الشخصي',
      app: 'التطبيق',
      localization: 'اللغة',
      support: 'الدعم',
      language: 'اللغة',
      transcription: 'النطق',
      darkMode: 'الوضع الداكن',
      notifications: 'الإشعارات الذكية',
      hapticFeedback: 'الاهتزاز',
      soundEffects: 'التأثيرات الصوتية',
      myProfile: 'ملفي الشخصي',
      name: 'الاسم',
      timezone: 'المنطقة الزمنية',
      madhab: 'المذهب',
      help: 'المساعدة والأسئلة الشائعة',
      feedback: 'ملاحظات',
      privacy: 'سياسة الخصوصية',
      cyrillic: 'السيريلية',
      latin: 'اللاتينية',
      russian: 'الروسية',
      english: 'الإنجليزية',
      arabic: 'العربية',
    },
    tasbih: {
      title: 'تسبيح',
      selectDhikr: 'اختر ذكراً...',
      quickSelect: 'اختيار سريع',
      rounds: 'جولات',
      count: 'العدد',
      reset: 'إعادة تعيين',
      undo: 'تراجع',
      complete: 'إكمال',
      transcription: 'النطق',
      translation: 'الترجمة',
      audio: 'التشغيل',
      settings: 'الإعدادات',
      transcriptionType: 'نوع النطق',
      goalCompleted: 'تم تحقيق الهدف!',
      sessionResumed: 'تم استئناف الجلسة',
      dhikrSaved: 'تم حفظ الذكر',
      errorCreatingSession: 'فشل في إنشاء الجلسة',
      errorResumingSession: 'فشل في استئناف الجلسة',
      noActionToUndo: 'لا يوجد إجراء للتراجع',
      fullReset: 'إعادة تعيين الكل',
      resetCounter: 'إعادة تعيين العداد',
      goal: 'الهدف',
      leftOf: 'متبقي من',
      counter: 'العداد',
      removeGoal: 'إزالة الهدف',
      goalCompletedMessage: 'ما شاء الله! تم تحقيق الهدف!',
      autoInterval: 'تعيين الفاصل التلقائي (ثانية)',
      stopAutoTap: 'إيقاف النقر التلقائي',
      startAutoTap: 'بدء النقر التلقائي',
      from1To60Sec: 'من 1 إلى 60 ثانية',
      goalColon: 'الهدف:',
      repeatCount: 'عدد التكرارات',
      learned: 'تم التعلم!',
      repeat: 'كرر',
      markLearned: 'تعلم',
    },
    goals: {
      title: 'الأهداف',
      activeGoals: 'الأهداف النشطة',
      completedGoals: 'الأهداف المكتملة',
      createGoal: 'إنشاء هدف',
      createHabit: 'إنشاء عادة',
      editGoal: 'تعديل الهدف',
      deleteGoal: 'حذف الهدف',
      pauseGoal: 'إيقاف الهدف مؤقتاً',
      resumeGoal: 'استئناف الهدف',
      category: 'الفئة',
      target: 'الهدف',
      progress: 'التقدم',
      deadline: 'الموعد النهائي',
      dailyPlan: 'الخطة اليومية',
      daysLeft: 'الأيام المتبقية',
      goalCreated: 'تم إنشاء الهدف',
      goalUpdated: 'تم تحديث الهدف',
      goalDeleted: 'تم حذف الهدف',
      goalPaused: 'تم إيقاف الهدف مؤقتاً',
      goalResumed: 'تم استئناف الهدف',
      goalLimitReached: 'تم الوصول إلى حد الأهداف',
      errorCreatingGoal: 'فشل في حفظ الهدف',
      errorUpdatingGoal: 'فشل في تحديث الهدف',
      errorDeletingGoal: 'فشل في حذف الهدف',
      confirmDeleteGoal: 'حذف الهدف؟',
      confirmDeleteHabit: 'حذف العادة؟',
      confirmDeleteTask: 'حذف المهمة؟',
      confirmDeleteSession: 'حذف الجلسة غير المكتملة؟',
      cannotUndo: 'التراجع متاح فقط خلال 5 ثوان من الإجراء',
    },
    zikry: {
      title: 'الأذكار',
      categories: 'الفئات',
      all: 'الكل',
      today: 'اليوم',
      popular: 'الشائع',
      search: 'بحث',
      startTasbih: 'بدء التسبيح',
      viewDetails: 'عرض التفاصيل',
      copy: 'نسخ',
      share: 'مشاركة',
      bookmark: 'إضافة إلى الإشارات المرجعية',
      copied: 'تم النسخ',
      copiedForShare: 'تم النسخ للمشاركة',
      translation: 'الترجمة',
      source: 'المصدر:',
      benefit: 'الفضيلة',
      todayDua: 'دعاء اليوم',
      favorites: 'المفضلة',
      found: 'تم العثور على:',
      total: 'المجموع:',
      noFavorites: 'لا توجد أذكار مفضلة',
      noFavoritesDescription: 'انقر على أيقونة القلب على الذكر لإضافته إلى المفضلة',
    },
    reports: {
      title: 'التقارير',
      stats: 'الإحصائيات',
      streaks: 'السلاسل',
      badges: 'الشارات',
      activity: 'النشاط',
      today: 'اليوم',
      achievements: 'الإنجازات',
      history: 'التاريخ',
      overallProgress: 'التقدم العام',
      completed: 'مكتمل',
      for: 'ل',
      week: 'أسبوع',
      month: 'شهر',
      quarter: 'ربع',
      year: 'سنة',
      streak: 'سلسلة',
      daysInRow: 'أيام متتالية',
      pending: 'قيد الانتظار',
      everythingDone: 'كل شيء تم',
      actions: 'إجراءات',
      missed: 'مفقود',
      forPeriod: 'للفترة',
      dynamics: 'الديناميكيات',
      executed: 'تم التنفيذ',
      percentCompletion: '% إكمال',
      whatToDoNow: 'ماذا تفعل الآن',
      completeTodayHabits: 'أكمل عادات اليوم',
      left: 'متبقي',
      allHabitsDone: 'جميع عادات اليوم مكتملة!',
      greatWork: 'عمل رائع، استمر!',
      overdueTasks: 'المهام المتأخرة',
      tasksRequireAttention: 'مهام تتطلب',
      task: 'مهمة',
      recoverHabits: 'استعادة',
      habit: 'عادة',
      habits: 'عادات',
      streakGrowing: 'السلسلة تنمو!',
      daysInPeriod: 'أيام في الفترة',
      allUnderControl: 'كل شيء تحت السيطرة!',
      noTasksRequiringAttention: 'لا توجد مهام تتطلب انتباهاً فورياً',
      missedHabits: 'العادات المفقودة',
      noMissedHabits: 'لا توجد عادات مفقودة',
      mark: 'علامة',
      pendingActions: 'الإجراءات المعلقة',
      overdueTasksCount: 'المهام المتأخرة',
      todayTasks: 'مهام اليوم',
      tasksCount: 'مهام',
      uncompletedHabits: 'العادات غير المكتملة',
      uncompletedHabitsCount: 'عادات غير مكتملة',
      todayHabits: 'عادات اليوم',
      noTodayHabits: 'لا توجد عادات لليوم',
      awaiting: 'في الانتظار',
      salawatAfterPrayer: 'الصلوات بعد الصلاة',
      activeGoals: 'الأهداف النشطة',
      totalTasks: 'إجمالي المهام',
      totalGoals: 'إجمالي الأهداف',
      deadline: 'الموعد النهائي',
      all: 'الكل',
      tasksToday: 'مهام اليوم',
      noTasksToday: 'لا توجد مهام لليوم',
      subtasks: 'المهام الفرعية',
      recommendation: 'توصية',
      receivedBadges: 'الشارات المستلمة',
      lockedBadges: 'الشارات المقفلة',
      inProgress: 'قيد التنفيذ',
      completedGoals: 'الأهداف المكتملة',
      loadMore: 'تحميل المزيد',
    },
    categories: {
      general: 'عام',
      surah: 'سورة',
      ayah: 'آية',
      dua: 'دعاء',
      azkar: 'أذكار',
      names99: '99 اسماً',
      salawat: 'صلوات',
      kalimat: 'كلمات',
    },
    prayers: {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
      none: 'غير مرتبط',
    },
    habits: {
      createHabit: 'إنشاء عادة',
      editHabit: 'تعديل العادة',
      deleteHabit: 'حذف العادة',
      habitCreated: 'تم إنشاء العادة',
      habitUpdated: 'تم تحديث العادة',
      habitDeleted: 'تم حذف العادة',
      errorCreatingHabit: 'فشل في حفظ العادة',
      errorUpdatingHabit: 'فشل في تحديث العادة',
      errorDeletingHabit: 'فشل في حذف العادة',
    },
    tasks: {
      createTask: 'إنشاء مهمة',
      editTask: 'تعديل المهمة',
      deleteTask: 'حذف المهمة',
      taskCreated: 'تم إنشاء المهمة',
      taskUpdated: 'تم تحديث المهمة',
      taskDeleted: 'تم حذف المهمة',
      errorCreatingTask: 'فشل في إنشاء المهمة',
      errorUpdatingTask: 'فشл в обновлении задачи',
      errorDeletingTask: 'فشل في حذف المهمة',
    },
    ai: {
      assistant: 'المساعد الذكي',
      greeting: 'مرحباً! أنا مساعد ذكي. يمكنني مساعدتك في إنشاء مهام أو عادات. ما عليك سوى وصف ما تريد القيام به!',
      placeholder: 'أدخل طلبك...',
      send: 'إرسال',
      listening: 'أستمع...',
      notAvailable: 'المساعد الذكي غير متاح مؤقتاً',
    },
    qaza: {
      title: 'حاسبة القضاء',
      calculate: 'حساب',
      birthDate: 'تاريخ الميلاد',
      gender: 'الجنس',
      male: 'ذكر',
      female: 'أنثى',
      bulughAge: 'سن البلوغ',
      prayerStartDate: 'تاريخ بدء الصلاة',
      travelDays: 'أيام السفر',
      haidDays: 'أيام الحيض شهرياً',
      childbirthCount: 'عدد الولادات',
    },
  },
};

export default translations;
