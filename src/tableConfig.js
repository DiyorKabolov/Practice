const PERFORMANCE_MARK_OPTIONS = {
  zachet: [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
  ],
  exam: [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ],
};

const DAY_OPTIONS = [
  { value: 'Понедельник', label: 'Понедельник' },
  { value: 'Вторник', label: 'Вторник' },
  { value: 'Среда', label: 'Среда' },
  { value: 'Четверг', label: 'Четверг' },
  { value: 'Пятница', label: 'Пятница' },
  { value: 'Суббота', label: 'Суббота' },
];

const LESSON_TYPE_OPTIONS = [
  { value: 'Лекция', label: 'Лекция' },
  { value: 'Практика', label: 'Практика' },
  { value: 'Лабораторная', label: 'Лабораторная' },
  { value: 'Семинар', label: 'Семинар' },
  { value: 'Консультация', label: 'Консультация' },
];

const makeNumberOptions = (values) => values.map((value) => ({ value: String(value), label: String(value) }));

const COURSE_OPTIONS = makeNumberOptions([1, 2, 3, 4, 5, 6]);
const SEMESTER_OPTIONS = makeNumberOptions(Array.from({ length: 12 }, (_, index) => index + 1));
const PAIR_OPTIONS = makeNumberOptions(Array.from({ length: 8 }, (_, index) => index + 1));

function getPerformanceMarkOptions(draftRow) {
  const form = String(draftRow?.ControlForm || '')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .trim();

  if (form === 'зачет') {
    return PERFORMANCE_MARK_OPTIONS.zachet;
  }

  if (form === 'экзамен') {
    return PERFORMANCE_MARK_OPTIONS.exam;
  }

  return [];
}

// ─── Общие валидаторы ───────────────────────────────────────────────────────

/** ФИО: только буквы (рус/лат), пробелы, дефисы */
function validateName(value) {
  if (!value || String(value).trim() === '') return 'Поле обязательно для заполнения';
  if (/\d/.test(value)) return 'ФИО не должно содержать цифры';
  if (/[^а-яёА-ЯЁa-zA-Z\s\-']/.test(value)) return 'Недопустимые символы в имени';
  return null;
}

/** Телефон: может начинаться с + или 8, затем только цифры, скобки, пробелы, дефисы */
function validatePhone(value) {
  if (!value || String(value).trim() === '') return null; // необязательное поле
  const cleaned = String(value).trim();
  if (/[a-zA-Zа-яёА-ЯЁ]/.test(cleaned)) return 'Номер телефона не должен содержать буквы';
  if (!/^[+\d][\d\s\-().]+$/.test(cleaned)) return 'Формат: +7XXXXXXXXXX или 8XXXXXXXXXX';
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return 'Номер телефона должен содержать от 10 до 15 цифр';
  return null;
}

/** Email: стандартная проверка */
function validateEmail(value) {
  if (!value || String(value).trim() === '') return null; // необязательное поле
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
    return 'Введите корректный адрес электронной почты';
  }
  return null;
}

/** Специальности — код: буквы, цифры, точки, пробелы */
function validateSpecialtyCode(value) {
  if (!value || String(value).trim() === '') return 'Код специальности обязателен';
  if (/[^а-яёА-ЯЁa-zA-Z0-9.\s\-]/.test(value)) return 'Недопустимые символы в коде специальности';
  return null;
}

/** Целое неотрицательное */
function validateNonNegativeInt(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Введите число';
  if (!Number.isInteger(n)) return 'Введите целое число';
  if (n < 0) return 'Значение не может быть отрицательным';
  return null;
}

/** Число в диапазоне */
function validateRange(min, max) {
  return (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return 'Введите число';
    if (n < min || n > max) return `Значение должно быть от ${min} до ${max}`;
    return null;
  };
}

export const TABLES = {
  specialties: {
    title: 'Специальности',
    hint: 'Направления подготовки и факультеты',
    icon: 'SP',
    key: 'SpecialtyID',
    fields: [
      {
        name: 'SpecialtyCode',
        label: 'Код специальности',
        type: 'text',
        required: true,
        validate: validateSpecialtyCode,
      },
      {
        name: 'SpecialtyName',
        label: 'Название',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Название обязательно' : null),
      },
      {
        name: 'Faculty',
        label: 'Факультет',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Факультет обязателен' : null),
      },
    ],
    columns: ['SpecialtyID', 'SpecialtyCode', 'SpecialtyName', 'Faculty'],
    columnLabels: {
      SpecialtyID: 'ID',
      SpecialtyCode: 'Код',
      SpecialtyName: 'Название',
      Faculty: 'Факультет',
    },
  },
  groups: {
    title: 'Группы',
    hint: 'Учебные группы и связь со специальностями',
    icon: 'GR',
    key: 'GroupID',
    fields: [
      {
        name: 'GroupName',
        label: 'Название группы',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Название группы обязательно' : null),
      },
      { name: 'SpecialtyID', label: 'Специальность', type: 'select', lookup: 'specialties', required: true },
      {
        name: 'Course',
        label: 'Курс',
        type: 'number',
        required: true,
        min: 1,
        max: 6,
        validate: validateRange(1, 6),
      },
    ],
    columns: ['GroupID', 'GroupName', 'SpecialtyDisplay', 'Course'],
    columnLabels: {
      GroupID: 'ID',
      GroupName: 'Группа',
      SpecialtyDisplay: 'Специальность',
      Course: 'Курс',
    },
    filters: [
      { field: 'SpecialtyID', label: 'Специальность', type: 'select', lookup: 'specialties' },
      { field: 'Course', label: 'Курс', type: 'select', options: COURSE_OPTIONS },
    ],
  },
  students: {
    title: 'Студенты',
    hint: 'Карточки студентов и принадлежность к группам',
    icon: 'ST',
    key: 'StudentID',
    fields: [
      {
        name: 'LastName',
        label: 'Фамилия',
        type: 'text',
        required: true,
        validate: validateName,
      },
      {
        name: 'FirstName',
        label: 'Имя',
        type: 'text',
        required: true,
        validate: validateName,
      },
      {
        name: 'MiddleName',
        label: 'Отчество',
        type: 'text',
        validate: (v) => {
          if (!v || !v.trim()) return null;
          return validateName(v);
        },
      },
      { name: 'GroupID', label: 'Группа', type: 'select', lookup: 'groups', required: true },
      {
        name: 'Phone',
        label: 'Телефон',
        type: 'text',
        validate: validatePhone,
      },
      {
        name: 'Address',
        label: 'Адрес',
        type: 'text',
      },
      {
        name: 'Email',
        label: 'Эл. почта',
        type: 'email',
        validate: validateEmail,
      },
      { name: 'BirthDate', label: 'Дата рождения', type: 'date' },
    ],
    columns: ['StudentID', 'LastName', 'FirstName', 'MiddleName', 'GroupName', 'BirthDate', 'Email'],
    columnLabels: {
      StudentID: 'ID',
      LastName: 'Фамилия',
      FirstName: 'Имя',
      MiddleName: 'Отчество',
      GroupName: 'Группа',
      BirthDate: 'Дата рождения',
      Email: 'Почта',
    },
    filters: [
      { field: 'GroupID', label: 'Группа', type: 'select', lookup: 'groups' },
    ],
  },
  teachers: {
    title: 'Преподаватели',
    hint: 'Справочник преподавателей, должностей и контактов',
    icon: 'TC',
    key: 'TeacherID',
    fields: [
      {
        name: 'LastName',
        label: 'Фамилия',
        type: 'text',
        required: true,
        validate: validateName,
      },
      {
        name: 'FirstName',
        label: 'Имя',
        type: 'text',
        required: true,
        validate: validateName,
      },
      {
        name: 'MiddleName',
        label: 'Отчество',
        type: 'text',
        validate: (v) => {
          if (!v || !v.trim()) return null;
          return validateName(v);
        },
      },
      { name: 'AcademicDegree', label: 'Ученая степень', type: 'text' },
      { name: 'AcademicTitle', label: 'Ученое звание', type: 'text' },
      { name: 'Position', label: 'Должность', type: 'text' },
      {
        name: 'Phone',
        label: 'Телефон',
        type: 'text',
        validate: validatePhone,
      },
      { name: 'Address', label: 'Адрес', type: 'text' },
      {
        name: 'Email',
        label: 'Эл. почта',
        type: 'email',
        validate: validateEmail,
      },
    ],
    columns: ['TeacherID', 'LastName', 'FirstName', 'MiddleName', 'AcademicDegree', 'AcademicTitle', 'Position', 'Email'],
    columnLabels: {
      TeacherID: 'ID',
      LastName: 'Фамилия',
      FirstName: 'Имя',
      MiddleName: 'Отчество',
      AcademicDegree: 'Степень',
      AcademicTitle: 'Звание',
      Position: 'Должность',
      Email: 'Почта',
    },
    filters: [
      { field: 'Position', label: 'Должность', type: 'select' },
    ],
  },
  subjects: {
    title: 'Предметы',
    hint: 'Дисциплины, семестры, часы и форма контроля',
    icon: 'SB',
    key: 'SubjectID',
    fields: [
      {
        name: 'SubjectName',
        label: 'Название',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Название предмета обязательно' : null),
      },
      {
        name: 'Semester',
        label: 'Семестр',
        type: 'number',
        required: true,
        min: 1,
        max: 12,
        validate: validateRange(1, 12),
      },
      {
        name: 'HoursCount',
        label: 'Количество часов',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'ControlForm',
        label: 'Форма контроля',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Форма контроля обязательна' : null),
      },
    ],
    columns: ['SubjectID', 'SubjectName', 'Semester', 'HoursCount', 'ControlForm'],
    columnLabels: {
      SubjectID: 'ID',
      SubjectName: 'Название',
      Semester: 'Семестр',
      HoursCount: 'Часы',
      ControlForm: 'Контроль',
    },
    filters: [
      { field: 'Semester', label: 'Семестр', type: 'select', options: SEMESTER_OPTIONS },
      { field: 'ControlForm', label: 'Контроль', type: 'select' },
    ],
  },
  auditories: {
    title: 'Аудитории',
    hint: 'Справочник учебных помещений',
    icon: 'RM',
    key: 'AuditoryID',
    fields: [
      {
        name: 'RoomNumber',
        label: 'Номер',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Номер аудитории обязателен' : null),
      },
      {
        name: 'RoomType',
        label: 'Тип аудитории',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Тип аудитории обязателен' : null),
      },
    ],
    columns: ['AuditoryID', 'RoomNumber', 'RoomType'],
    columnLabels: {
      AuditoryID: 'ID',
      RoomNumber: 'Номер',
      RoomType: 'Тип',
    },
    filters: [
      { field: 'RoomType', label: 'Тип аудитории', type: 'select' },
    ],
  },
  discipline: {
    title: 'Учебная нагрузка',
    hint: 'Связка предмета, преподавателя, группы и часов',
    icon: 'DS',
    key: 'DisciplineID',
    fields: [
      { name: 'SubjectID', label: 'Предмет', type: 'select', lookup: 'subjects', required: true },
      { name: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers', required: true },
      { name: 'GroupID', label: 'Группа', type: 'select', lookup: 'groups', required: true },
      {
        name: 'LectureHours',
        label: 'Лекции',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'PracticalHours',
        label: 'Практика',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'LaboratoryHours',
        label: 'Лабораторные',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'OtherWorkHours',
        label: 'Другая работа',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'ControlHours',
        label: 'Контрольные часы',
        type: 'number',
        step: '0.01',
        min: 0,
        validate: (v) => {
          if (v === '' || v === null || v === undefined) return null;
          const n = Number(v);
          if (!Number.isFinite(n)) return 'Введите число';
          if (n < 0) return 'Значение не может быть отрицательным';
          return null;
        },
      },
    ],
    columns: [
      'DisciplineID',
      'SubjectName',
      'TeacherName',
      'GroupName',
      'LectureHours',
      'PracticalHours',
      'LaboratoryHours',
      'OtherWorkHours',
      'ControlForm',
      'CalculatedControlHours',
    ],
    columnLabels: {
      DisciplineID: 'ID',
      SubjectName: 'Предмет',
      TeacherName: 'Преподаватель',
      GroupName: 'Группа',
      LectureHours: 'Лекции',
      PracticalHours: 'Практика',
      LaboratoryHours: 'Лаб.',
      OtherWorkHours: 'Прочее',
      ControlForm: 'Контроль',
      CalculatedControlHours: 'Контр. часы',
    },
    filters: [
      { field: 'SubjectID', label: 'Предмет', type: 'select', lookup: 'subjects' },
      { field: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers' },
      { field: 'GroupID', label: 'Группа', type: 'select', lookup: 'groups' },
      { field: 'ControlForm', label: 'Форма контроля', type: 'select' },
    ],
  },
  weeks: {
    title: 'Недели',
    hint: 'Календарные недели учебного процесса',
    icon: 'WK',
    key: 'WeekID',
    fields: [
      {
        name: 'WeekName',
        label: 'Название',
        type: 'text',
        required: true,
        validate: (v) => (!v || !v.trim() ? 'Название обязательно' : null),
      },
      {
        name: 'StartDate',
        label: 'Дата начала',
        type: 'date',
        required: true,
        validate: (v) => (!v ? 'Дата начала обязательна' : null),
      },
      {
        name: 'EndDate',
        label: 'Дата конца',
        type: 'date',
        required: true,
        validate: (v, row) => {
          if (!v) return 'Дата конца обязательна';
          if (row?.StartDate && v < row.StartDate) return 'Дата конца не может быть раньше даты начала';
          return null;
        },
      },
    ],
    columns: ['WeekID', 'WeekName', 'StartDate', 'EndDate'],
    columnLabels: {
      WeekID: 'ID',
      WeekName: 'Название',
      StartDate: 'Начало',
      EndDate: 'Конец',
    },
  },
  attendance: {
    title: 'Посещаемость',
    hint: 'Учет посещений студентов по датам и парам',
    icon: 'AT',
    key: 'AttendanceID',
    fields: [
      { name: 'StudentID', label: 'Студент', type: 'select', lookup: 'students', required: true },
      {
        name: 'Day',
        label: 'День',
        type: 'date',
        required: true,
        validate: (v) => (!v ? 'Дата обязательна' : null),
      },
      {
        name: 'PairNumber',
        label: 'Пара',
        type: 'number',
        required: true,
        min: 1,
        max: 12,
        validate: validateRange(1, 12),
      },
      {
        name: 'Mark',
        label: 'Отметка',
        type: 'select',
        required: true,
        options: [
          { value: '0', label: '0' },
          { value: '1', label: '1' },
        ],
      },
    ],
    columns: ['AttendanceID', 'StudentName', 'Day', 'PairNumber', 'Mark'],
    columnLabels: {
      AttendanceID: 'ID',
      StudentName: 'Студент',
      Day: 'День',
      PairNumber: 'Пара',
      Mark: 'Отметка',
    },
    filters: [
      { field: 'StudentID', label: 'Студент', type: 'select', lookup: 'students' },
      { field: 'PairNumber', label: 'Пара', type: 'select', options: PAIR_OPTIONS },
    ],
  },
  performance: {
    title: 'Успеваемость',
    hint: 'Оценки по зачётам и экзаменам',
    icon: 'PR',
    key: 'PerformanceID',
    fields: [
      { name: 'StudentID', label: 'Студент', type: 'select', lookup: 'students', required: true },
      { name: 'SubjectID', label: 'Дисциплина', type: 'select', lookup: 'subjects', required: true },
      { name: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers', required: true },
      {
        name: 'ControlForm',
        label: 'Форма контроля',
        type: 'select',
        required: true,
        options: [
          { value: 'зачет', label: 'Зачет' },
          { value: 'экзамен', label: 'Экзамен' },
        ],
      },
      {
        name: 'MarkCode',
        label: 'Отметка',
        type: 'select',
        required: true,
        getOptions: getPerformanceMarkOptions,
      },
      {
        name: 'Tour',
        label: 'Тур',
        type: 'number',
        required: false,
        min: 1,
        validate: (v) => {
          if (v === '' || v === null || v === undefined) return null;
          const n = Number(v);
          if (!Number.isFinite(n) || !Number.isInteger(n)) return 'Введите целое число';
          if (n < 1) return 'Тур должен быть не менее 1';
          return null;
        },
      },
    ],
    columns: ['PerformanceID', 'StudentName', 'DisciplineName', 'TeacherName', 'ControlForm', 'Tour', 'MarkDisplay'],
    columnLabels: {
      PerformanceID: 'ID',
      StudentName: 'Студент',
      DisciplineName: 'Дисциплина',
      TeacherName: 'Преподаватель',
      ControlForm: 'Форма',
      Tour: 'Тур',
      MarkDisplay: 'Отметка',
    },
    filters: [
      { field: 'StudentID', label: 'Студент', type: 'select', lookup: 'students' },
      { field: 'SubjectID', label: 'Дисциплина', type: 'select', lookup: 'subjects' },
      { field: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers' },
      { field: 'ControlForm', label: 'Форма', type: 'select', options: [
        { value: 'зачет', label: 'Зачет' },
        { value: 'экзамен', label: 'Экзамен' },
      ] },
      { field: 'MarkCode', label: 'Отметка', type: 'select', options: [
        { value: '0', label: '0' },
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
      ] },
    ],
  },
  execution: {
    title: 'Выполнение',
    hint: 'Учет нагрузки преподавателя по дисциплинам',
    icon: 'EX',
    key: 'ExecutionID',
    fields: [
      { name: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers', required: true },
      { name: 'SubjectID', label: 'Дисциплина', type: 'select', lookup: 'subjects', required: true },
      {
        name: 'LectureHours',
        label: 'Лекции',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'PracticalHours',
        label: 'Практические',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'LaboratoryHours',
        label: 'Лабораторные',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
      {
        name: 'OtherWorkHours',
        label: 'Другие работы',
        type: 'number',
        required: true,
        min: 0,
        validate: validateNonNegativeInt,
      },
    ],
    columns: ['ExecutionID', 'TeacherName', 'DisciplineName', 'LectureHours', 'PracticalHours', 'LaboratoryHours', 'OtherWorkHours'],
    columnLabels: {
      ExecutionID: 'ID',
      TeacherName: 'Преподаватель',
      DisciplineName: 'Дисциплина',
      LectureHours: 'Лекции',
      PracticalHours: 'Практические',
      LaboratoryHours: 'Лабораторные',
      OtherWorkHours: 'Другие',
    },
    filters: [
      { field: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers' },
      { field: 'SubjectID', label: 'Дисциплина', type: 'select', lookup: 'subjects' },
    ],
  },
  schedule: {
    title: 'Расписание',
    hint: 'Дни, пары, аудитории и группы',
    icon: 'SC',
    key: 'ScheduleID',
    fields: [
      { name: 'WeekID', label: 'Неделя', type: 'select', lookup: 'weeks', required: true },
      { name: 'Day', label: 'День', type: 'select', required: true, options: DAY_OPTIONS },
      {
        name: 'PairNumber',
        label: 'Пара',
        type: 'number',
        required: true,
        min: 1,
        max: 8,
        validate: validateRange(1, 8),
      },
      { name: 'SubjectID', label: 'Предмет', type: 'select', lookup: 'subjects', required: true },
      { name: 'TeacherID', label: 'Преподаватель', type: 'select', lookup: 'teachers', required: true },
      { name: 'LessonType', label: 'Тип занятия', type: 'select', required: true, options: LESSON_TYPE_OPTIONS },
      { name: 'AuditoryID', label: 'Аудитория', type: 'select', lookup: 'auditories', required: true },
      { name: 'GroupID', label: 'Группа', type: 'select', lookup: 'groups', required: true },
    ],
    columns: ['ScheduleID', 'Day', 'PairNumber', 'SubjectName', 'TeacherName', 'LessonType', 'RoomName', 'GroupName'],
    columnLabels: {
      ScheduleID: 'ID',
      Day: 'День',
      PairNumber: 'Пара',
      SubjectName: 'Предмет',
      TeacherName: 'Преподаватель',
      LessonType: 'Тип',
      RoomName: 'Аудитория',
      GroupName: 'Группа',
    },
  },
};

export const TABLE_KEYS = Object.keys(TABLES);
