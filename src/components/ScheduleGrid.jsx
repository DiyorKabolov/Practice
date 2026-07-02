import { useMemo, useState } from 'react';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const PAIRS = [1, 2, 3, 4, 5, 6, 7, 8];

const PAIR_TIMES = {
  1: '08:00–09:35',
  2: '09:50–11:25',
  3: '11:40–13:15',
  4: '14:00–15:35',
  5: '15:50–17:25',
  6: '17:40–19:15',
  7: '19:30–21:05',
  8: '21:15–22:50',
};

const LESSON_COLORS = {
  Лекция: { bg: 'var(--ls-lecture-bg)', border: 'var(--ls-lecture-border)', badge: 'var(--ls-lecture-badge)' },
  Практика: { bg: 'var(--ls-practice-bg)', border: 'var(--ls-practice-border)', badge: 'var(--ls-practice-badge)' },
  Лабораторная: { bg: 'var(--ls-lab-bg)', border: 'var(--ls-lab-border)', badge: 'var(--ls-lab-badge)' },
  Семинар: { bg: 'var(--ls-seminar-bg)', border: 'var(--ls-seminar-border)', badge: 'var(--ls-seminar-badge)' },
  Консультация: { bg: 'var(--ls-consult-bg)', border: 'var(--ls-consult-border)', badge: 'var(--ls-consult-badge)' },
};

const LESSON_TYPE_OPTIONS = ['Лекция', 'Практика', 'Лабораторная', 'Семинар', 'Консультация'];

function getLessonColor(type) {
  return LESSON_COLORS[type] || LESSON_COLORS.Лекция;
}

function createLookupMap(items) {
  return Object.fromEntries((items || []).map((item) => [String(item.id), item.label]));
}

function LessonCard({ lesson, display, onEdit, onDelete }) {
  const colors = getLessonColor(lesson.LessonType);

  return (
    <div className="schedule-card" title={`${display.subjectName} — ${display.teacherName}`}>
      <div className="schedule-card-header">
        <span className="schedule-card-type" style={{ background: colors.badge }}>
          {lesson.LessonType}
        </span>
        <span className="schedule-card-room">{display.roomName || '—'}</span>
      </div>
      <div className="schedule-card-subject">{display.subjectName}</div>
      <div className="schedule-card-teacher">{display.teacherName}</div>
      <div className="schedule-card-group">{display.groupName}</div>
      <div className="schedule-card-actions">
        <button
          type="button"
          className="schedule-card-btn schedule-card-btn-edit"
          title="Редактировать"
          onClick={() => onEdit(lesson.ScheduleID)}
        >
          ✏️
        </button>
        <button
          type="button"
          className="schedule-card-btn schedule-card-btn-delete"
          title="Удалить"
          onClick={() => onDelete(lesson.ScheduleID)}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

export default function ScheduleGrid({ rows, lookups, onEdit, onDelete }) {
  const [filters, setFilters] = useState({
    week: '',
    day: '',
    group: '',
    teacher: '',
    subject: '',
    auditory: '',
    lessonType: '',
  });
  const [viewMode, setViewMode] = useState('grid');

  const groups = useMemo(() => lookups?.groups || [], [lookups]);
  const teachers = useMemo(() => lookups?.teachers || [], [lookups]);
  const subjects = useMemo(() => lookups?.subjects || [], [lookups]);
  const auditories = useMemo(() => lookups?.auditories || [], [lookups]);
  const weeks = useMemo(() => lookups?.weeks || [], [lookups]);

  const groupLabels = useMemo(() => createLookupMap(groups), [groups]);
  const teacherLabels = useMemo(() => createLookupMap(teachers), [teachers]);
  const subjectLabels = useMemo(() => createLookupMap(subjects), [subjects]);
  const auditoryLabels = useMemo(() => createLookupMap(auditories), [auditories]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.week && String(row.WeekID) !== filters.week) return false;
      if (filters.day && String(row.Day) !== filters.day) return false;
      if (filters.group && String(row.GroupID) !== filters.group) return false;
      if (filters.teacher && String(row.TeacherID) !== filters.teacher) return false;
      if (filters.subject && String(row.SubjectID) !== filters.subject) return false;
      if (filters.auditory && String(row.AuditoryID) !== filters.auditory) return false;
      if (filters.lessonType && String(row.LessonType) !== filters.lessonType) return false;
      return true;
    });
  }, [rows, filters]);

  const scheduleMap = useMemo(() => {
    const map = {};

    for (const day of DAYS) {
      map[day] = {};
      for (const pair of PAIRS) {
        map[day][pair] = [];
      }
    }

    for (const row of filteredRows) {
      const day = String(row.Day || '');
      const pair = Number(row.PairNumber);
      if (map[day] && map[day][pair] !== undefined) {
        map[day][pair].push(row);
      }
    }

    return map;
  }, [filteredRows]);

  const activePairs = useMemo(() => {
    const active = new Set(filteredRows.map((row) => Number(row.PairNumber)));
    return PAIRS.filter((pair) => active.has(pair) || pair <= 4);
  }, [filteredRows]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const clearFilters = () => {
    setFilters({
      week: '',
      day: '',
      group: '',
      teacher: '',
      subject: '',
      auditory: '',
      lessonType: '',
    });
  };

  const getDisplay = (lesson) => ({
    subjectName: subjectLabels[String(lesson.SubjectID)] || '—',
    teacherName: teacherLabels[String(lesson.TeacherID)] || '—',
    roomName: auditoryLabels[String(lesson.AuditoryID)] || '—',
    groupName: groupLabels[String(lesson.GroupID)] || '—',
  });

  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📅 Расписание пусто</div>
        <div>Добавьте первое занятие или используйте автогенерацию.</div>
      </div>
    );
  }

  return (
    <div className="schedule-wrap">
      <div className="schedule-filters">
        <div className="schedule-filter-group">
          <span className="schedule-filter-label">Неделя:</span>
          <select
            className="schedule-filter-select"
            value={filters.week}
            onChange={(event) => setFilters((prev) => ({ ...prev, week: event.target.value }))}
          >
            <option value="">Все недели</option>
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                {week.label}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-group">
          <span className="schedule-filter-label">День:</span>
          <select
            className="schedule-filter-select"
            value={filters.day}
            onChange={(event) => setFilters((prev) => ({ ...prev, day: event.target.value }))}
          >
            <option value="">Все дни</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-group">
          <span className="schedule-filter-label">Группа:</span>
          <select
            className="schedule-filter-select"
            value={filters.group}
            onChange={(event) => setFilters((prev) => ({ ...prev, group: event.target.value }))}
          >
            <option value="">Все группы</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-group">
          <span className="schedule-filter-label">Преподаватель:</span>
          <select
            className="schedule-filter-select"
            value={filters.teacher}
            onChange={(event) => setFilters((prev) => ({ ...prev, teacher: event.target.value }))}
          >
            <option value="">Все преподаватели</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.label}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-group">
          <span className="schedule-filter-label">Предмет:</span>
          <select
            className="schedule-filter-select"
            value={filters.subject}
            onChange={(event) => setFilters((prev) => ({ ...prev, subject: event.target.value }))}
          >
            <option value="">Все предметы</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.label}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-group">
          <span className="schedule-filter-label">Аудитория:</span>
          <select
            className="schedule-filter-select"
            value={filters.auditory}
            onChange={(event) => setFilters((prev) => ({ ...prev, auditory: event.target.value }))}
          >
            <option value="">Все аудитории</option>
            {auditories.map((auditory) => (
              <option key={auditory.id} value={auditory.id}>
                {auditory.label}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-group">
          <span className="schedule-filter-label">Тип занятия:</span>
          <select
            className="schedule-filter-select"
            value={filters.lessonType}
            onChange={(event) => setFilters((prev) => ({ ...prev, lessonType: event.target.value }))}
          >
            <option value="">Все типы</option>
            {LESSON_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-filter-legend">
          {Object.entries(LESSON_COLORS).map(([type, colors]) => (
            <span key={type} className="legend-item">
              <span className="legend-dot" style={{ background: colors.border }} />
              {type}
            </span>
          ))}
        </div>

        <div className="schedule-view-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Вид сетки"
          >
            ⊞ Сетка
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Вид списка"
          >
            ☰ Список
          </button>
        </div>
      </div>

      {filteredRows.length ? (
        viewMode === 'grid' ? (
          <div className="schedule-grid-outer">
            <div
              className="schedule-grid"
              style={{ gridTemplateColumns: `160px repeat(${activePairs.length}, minmax(0, 1fr))` }}
            >
              <div className="schedule-corner-cell">День / Пара</div>
              {activePairs.map((pair) => (
                <div key={`pair-header-${pair}`} className="schedule-pair-header schedule-pair-header-top">
                  <span className="schedule-pair-num">{pair}</span>
                  <span className="schedule-pair-time">{PAIR_TIMES[pair]}</span>
                </div>
              ))}

              {DAYS.map((day) => (
                <div key={`day-row-${day}`} style={{ display: 'contents' }}>
                  <div className="schedule-day-header schedule-day-header-side">{day}</div>
                  {activePairs.map((pair) => {
                    const lessons = scheduleMap[day][pair];
                    return (
                      <div
                        key={`${day}-${pair}`}
                        className={`schedule-cell ${lessons.length ? 'schedule-cell-filled' : 'schedule-cell-empty'}`}
                      >
                        {lessons.map((lesson) => (
                          <LessonCard
                            key={lesson.ScheduleID}
                            lesson={lesson}
                            display={getDisplay(lesson)}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="schedule-list">
            {DAYS.map((day) => {
              const dayLessons = filteredRows
                .filter((lesson) => lesson.Day === day)
                .sort((a, b) => Number(a.PairNumber) - Number(b.PairNumber));

              if (!dayLessons.length) {
                return null;
              }

              return (
                <div key={day} className="schedule-list-day">
                  <div className="schedule-list-day-title">{day}</div>
                  <div className="schedule-list-pairs">
                    {dayLessons.map((lesson) => (
                      <div key={lesson.ScheduleID} className="schedule-list-item">
                        <div className="schedule-list-pair-num">
                          Пара {lesson.PairNumber}
                          <span className="schedule-list-time">{PAIR_TIMES[lesson.PairNumber]}</span>
                        </div>
                        <LessonCard
                          lesson={lesson}
                          display={getDisplay(lesson)}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">Ничего не найдено</div>
          <div>Попробуйте изменить фильтры или сбросить их.</div>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      <div className="schedule-footer-info">
        Показано занятий: <strong>{filteredRows.length}</strong>
        {hasActiveFilters && (
          <button type="button" className="schedule-clear-filter" onClick={clearFilters}>
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}
