-- Extra demo data for the MSU practice database.

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'102')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'102', N'Лекционная');

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'205')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'205', N'Компьютерный класс');

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'311')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'311', N'Семинарская');

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'408')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'408', N'Мультимедийная');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Программирование I')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Программирование I', 1, 144, N'экзамен');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Математический анализ')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Математический анализ', 1, 180, N'экзамен');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Теория вероятностей')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Теория вероятностей', 3, 108, N'экзамен');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Основы веб-разработки')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Основы веб-разработки', 4, 72, N'зачет');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Академическое письмо')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Академическое письмо', 1, 36, N'зачет');

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Иванова' AND FirstName = N'Анна')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Иванова', N'Анна', N'Сергеевна', N'кандидат технических наук', N'доцент', N'доцент кафедры', NULL, NULL, N'anna.ivanova@example.com');

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Петрова' AND FirstName = N'Мария')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Петрова', N'Мария', N'Ильинична', N'кандидат филологических наук', N'доцент', N'преподаватель', NULL, NULL, N'maria.petrova@example.com');

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Джураев' AND FirstName = N'Бахром')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Джураев', N'Бахром', N'Рахматович', NULL, N'старший преподаватель', N'старший преподаватель', NULL, NULL, N'bahrom.dzhuraev@example.com');

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Ходжаев' AND FirstName = N'Камол')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Ходжаев', N'Камол', N'Бахтиёрович', N'кандидат физико-математических наук', N'доцент', N'доцент кафедры', NULL, NULL, N'kamol.khodjaev@example.com');

IF NOT EXISTS (SELECT 1 FROM dbo.Weeks WHERE WeekName = N'1-я учебная неделя')
    INSERT INTO dbo.Weeks (WeekName, StartDate, EndDate)
    VALUES (N'1-я учебная неделя', '2026-09-01', '2026-09-06');

IF NOT EXISTS (SELECT 1 FROM dbo.Weeks WHERE WeekName = N'2-я учебная неделя')
    INSERT INTO dbo.Weeks (WeekName, StartDate, EndDate)
    VALUES (N'2-я учебная неделя', '2026-09-07', '2026-09-13');

IF NOT EXISTS (SELECT 1 FROM dbo.Weeks WHERE WeekName = N'3-я учебная неделя')
    INSERT INTO dbo.Weeks (WeekName, StartDate, EndDate)
    VALUES (N'3-я учебная неделя', '2026-09-14', '2026-09-20');

IF NOT EXISTS (SELECT 1 FROM dbo.Weeks WHERE WeekName = N'4-я учебная неделя')
    INSERT INTO dbo.Weeks (WeekName, StartDate, EndDate)
    VALUES (N'4-я учебная неделя', '2026-09-21', '2026-09-27');

DECLARE @SpecPmi INT = (SELECT TOP 1 SpecialtyID FROM dbo.Specialties WHERE SpecialtyCode = N'01.03.02');
DECLARE @SpecLing INT = (SELECT TOP 1 SpecialtyID FROM dbo.Specialties WHERE SpecialtyCode = N'45.03.02');
DECLARE @SpecGmu INT = (SELECT TOP 1 SpecialtyID FROM dbo.Specialties WHERE SpecialtyCode = N'38.03.04');

IF @SpecPmi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Groups] WHERE GroupName = N'ПМИ-22')
    INSERT INTO dbo.[Groups] (GroupName, SpecialtyID, Course)
    VALUES (N'ПМИ-22', @SpecPmi, 2);

IF @SpecPmi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Groups] WHERE GroupName = N'ПМИ-31')
    INSERT INTO dbo.[Groups] (GroupName, SpecialtyID, Course)
    VALUES (N'ПМИ-31', @SpecPmi, 3);

IF @SpecLing IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Groups] WHERE GroupName = N'ЛИН-12')
    INSERT INTO dbo.[Groups] (GroupName, SpecialtyID, Course)
    VALUES (N'ЛИН-12', @SpecLing, 2);

IF @SpecGmu IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Groups] WHERE GroupName = N'ГМУ-21')
    INSERT INTO dbo.[Groups] (GroupName, SpecialtyID, Course)
    VALUES (N'ГМУ-21', @SpecGmu, 2);

DECLARE @GroupPmi22 INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ПМИ-22');
DECLARE @GroupPmi31 INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ПМИ-31');
DECLARE @GroupLin12 INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ЛИН-12');
DECLARE @GroupGmu21 INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ГМУ-21');

IF @GroupPmi22 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Сидоров' AND FirstName = N'Никита')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Сидоров', N'Никита', N'Олегович', @GroupPmi22, NULL, NULL, N'nikita.sidorov@example.com', '2005-01-19');

IF @GroupPmi22 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Алиева' AND FirstName = N'Мадина')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Алиева', N'Мадина', N'Тимуровна', @GroupPmi22, NULL, NULL, N'madina.alieva@example.com', '2004-10-08');

IF @GroupPmi31 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Файзуллоев' AND FirstName = N'Дилшод')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Файзуллоев', N'Дилшод', N'Комилович', @GroupPmi31, NULL, NULL, N'dilshod.fayzulloev@example.com', '2003-12-02');

IF @GroupLin12 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Мирзоева' AND FirstName = N'Сабина')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Мирзоева', N'Сабина', N'Фарруховна', @GroupLin12, NULL, NULL, N'sabina.mirzoeva@example.com', '2005-06-25');

IF @GroupGmu21 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Кузнецов' AND FirstName = N'Артём')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Кузнецов', N'Артём', N'Павлович', @GroupGmu21, NULL, NULL, N'artem.kuznetsov@example.com', '2004-04-14');

DECLARE @SubjectProgramming INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Программирование I');
DECLARE @SubjectMath INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Математический анализ');
DECLARE @SubjectProb INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Теория вероятностей');
DECLARE @SubjectWeb INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Основы веб-разработки');
DECLARE @SubjectWriting INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Академическое письмо');

DECLARE @TeacherIvanova INT = (SELECT TOP 1 TeacherID FROM dbo.Teachers WHERE LastName = N'Иванова' AND FirstName = N'Анна');
DECLARE @TeacherPetrova INT = (SELECT TOP 1 TeacherID FROM dbo.Teachers WHERE LastName = N'Петрова' AND FirstName = N'Мария');
DECLARE @TeacherDzhuraev INT = (SELECT TOP 1 TeacherID FROM dbo.Teachers WHERE LastName = N'Джураев' AND FirstName = N'Бахром');
DECLARE @TeacherKhodjaev INT = (SELECT TOP 1 TeacherID FROM dbo.Teachers WHERE LastName = N'Ходжаев' AND FirstName = N'Камол');

DECLARE @GroupPmi22b INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ПМИ-22');
DECLARE @GroupPmi31b INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ПМИ-31');
DECLARE @GroupLin12b INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ЛИН-12');
DECLARE @GroupGmu21b INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ГМУ-21');

IF @SubjectProgramming IS NOT NULL AND @TeacherIvanova IS NOT NULL AND @GroupPmi22b IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Discipline WHERE SubjectID = @SubjectProgramming AND TeacherID = @TeacherIvanova AND GroupID = @GroupPmi22b)
    INSERT INTO dbo.Discipline (SubjectID, TeacherID, GroupID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours, ControlHours)
    VALUES (@SubjectProgramming, @TeacherIvanova, @GroupPmi22b, 32, 24, 20, 12, NULL);

IF @SubjectWeb IS NOT NULL AND @TeacherIvanova IS NOT NULL AND @GroupPmi31b IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Discipline WHERE SubjectID = @SubjectWeb AND TeacherID = @TeacherIvanova AND GroupID = @GroupPmi31b)
    INSERT INTO dbo.Discipline (SubjectID, TeacherID, GroupID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours, ControlHours)
    VALUES (@SubjectWeb, @TeacherIvanova, @GroupPmi31b, 18, 18, 24, 8, NULL);

IF @SubjectWriting IS NOT NULL AND @TeacherPetrova IS NOT NULL AND @GroupLin12b IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Discipline WHERE SubjectID = @SubjectWriting AND TeacherID = @TeacherPetrova AND GroupID = @GroupLin12b)
    INSERT INTO dbo.Discipline (SubjectID, TeacherID, GroupID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours, ControlHours)
    VALUES (@SubjectWriting, @TeacherPetrova, @GroupLin12b, 12, 12, 0, 6, NULL);

IF @SubjectMath IS NOT NULL AND @TeacherKhodjaev IS NOT NULL AND @GroupGmu21b IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Discipline WHERE SubjectID = @SubjectMath AND TeacherID = @TeacherKhodjaev AND GroupID = @GroupGmu21b)
    INSERT INTO dbo.Discipline (SubjectID, TeacherID, GroupID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours, ControlHours)
    VALUES (@SubjectMath, @TeacherKhodjaev, @GroupGmu21b, 30, 30, 0, 10, NULL);

IF @TeacherIvanova IS NOT NULL AND @SubjectProgramming IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Execution WHERE TeacherID = @TeacherIvanova AND SubjectID = @SubjectProgramming)
    INSERT INTO dbo.Execution (TeacherID, SubjectID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours)
    VALUES (@TeacherIvanova, @SubjectProgramming, 32, 24, 20, 12);

IF @TeacherPetrova IS NOT NULL AND @SubjectWriting IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Execution WHERE TeacherID = @TeacherPetrova AND SubjectID = @SubjectWriting)
    INSERT INTO dbo.Execution (TeacherID, SubjectID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours)
    VALUES (@TeacherPetrova, @SubjectWriting, 12, 12, 0, 6);

IF @TeacherKhodjaev IS NOT NULL AND @SubjectMath IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Execution WHERE TeacherID = @TeacherKhodjaev AND SubjectID = @SubjectMath)
    INSERT INTO dbo.Execution (TeacherID, SubjectID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours)
    VALUES (@TeacherKhodjaev, @SubjectMath, 30, 30, 0, 10);

IF @SubjectProgramming IS NOT NULL AND @TeacherIvanova IS NOT NULL AND @GroupPmi22b IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM dbo.Schedule
       WHERE [Day] = N'Понедельник' AND PairNumber = 1 AND SubjectID = @SubjectProgramming AND TeacherID = @TeacherIvanova AND LessonType = N'Лекция' AND GroupID = @GroupPmi22b
   )
    INSERT INTO dbo.Schedule ([Day], PairNumber, SubjectID, TeacherID, LessonType, AuditoryID, GroupID)
    VALUES (N'Понедельник', 1, @SubjectProgramming, @TeacherIvanova, N'Лекция', (SELECT TOP 1 AuditoryID FROM dbo.Auditories WHERE RoomNumber = N'205'), @GroupPmi22b);

IF @SubjectWriting IS NOT NULL AND @TeacherPetrova IS NOT NULL AND @GroupLin12b IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM dbo.Schedule
       WHERE [Day] = N'Вторник' AND PairNumber = 2 AND SubjectID = @SubjectWriting AND TeacherID = @TeacherPetrova AND LessonType = N'Практика' AND GroupID = @GroupLin12b
   )
    INSERT INTO dbo.Schedule ([Day], PairNumber, SubjectID, TeacherID, LessonType, AuditoryID, GroupID)
    VALUES (N'Вторник', 2, @SubjectWriting, @TeacherPetrova, N'Практика', (SELECT TOP 1 AuditoryID FROM dbo.Auditories WHERE RoomNumber = N'311'), @GroupLin12b);

IF @SubjectMath IS NOT NULL AND @TeacherKhodjaev IS NOT NULL AND @GroupGmu21b IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM dbo.Schedule
       WHERE [Day] = N'Среда' AND PairNumber = 3 AND SubjectID = @SubjectMath AND TeacherID = @TeacherKhodjaev AND LessonType = N'Лекция' AND GroupID = @GroupGmu21b
   )
    INSERT INTO dbo.Schedule ([Day], PairNumber, SubjectID, TeacherID, LessonType, AuditoryID, GroupID)
    VALUES (N'Среда', 3, @SubjectMath, @TeacherKhodjaev, N'Лекция', (SELECT TOP 1 AuditoryID FROM dbo.Auditories WHERE RoomNumber = N'102'), @GroupGmu21b);

IF @SubjectWeb IS NOT NULL AND @TeacherIvanova IS NOT NULL AND @GroupPmi31b IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM dbo.Schedule
       WHERE [Day] = N'Четверг' AND PairNumber = 4 AND SubjectID = @SubjectWeb AND TeacherID = @TeacherIvanova AND LessonType = N'Лабораторная' AND GroupID = @GroupPmi31b
   )
    INSERT INTO dbo.Schedule ([Day], PairNumber, SubjectID, TeacherID, LessonType, AuditoryID, GroupID)
    VALUES (N'Четверг', 4, @SubjectWeb, @TeacherIvanova, N'Лабораторная', (SELECT TOP 1 AuditoryID FROM dbo.Auditories WHERE RoomNumber = N'408'), @GroupPmi31b);

DECLARE @StudentSidorov INT = (SELECT TOP 1 StudentID FROM dbo.Students WHERE LastName = N'Сидоров' AND FirstName = N'Никита');
DECLARE @StudentAlieva INT = (SELECT TOP 1 StudentID FROM dbo.Students WHERE LastName = N'Алиева' AND FirstName = N'Мадина');
DECLARE @StudentFayzulloev INT = (SELECT TOP 1 StudentID FROM dbo.Students WHERE LastName = N'Файзуллоев' AND FirstName = N'Дилшод');
DECLARE @StudentMirzoeva INT = (SELECT TOP 1 StudentID FROM dbo.Students WHERE LastName = N'Мирзоева' AND FirstName = N'Сабина');
DECLARE @StudentKuznetsov INT = (SELECT TOP 1 StudentID FROM dbo.Students WHERE LastName = N'Кузнецов' AND FirstName = N'Артём');

IF @StudentSidorov IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Attendance WHERE StudentID = @StudentSidorov AND [Day] = '2026-09-01' AND PairNumber = 1)
    INSERT INTO dbo.Attendance (StudentID, [Day], PairNumber, Mark)
    VALUES (@StudentSidorov, '2026-09-01', 1, N'Присутствовал');

IF @StudentAlieva IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Attendance WHERE StudentID = @StudentAlieva AND [Day] = '2026-09-01' AND PairNumber = 1)
    INSERT INTO dbo.Attendance (StudentID, [Day], PairNumber, Mark)
    VALUES (@StudentAlieva, '2026-09-01', 1, N'Неявка');

IF @StudentMirzoeva IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Attendance WHERE StudentID = @StudentMirzoeva AND [Day] = '2026-09-02' AND PairNumber = 2)
    INSERT INTO dbo.Attendance (StudentID, [Day], PairNumber, Mark)
    VALUES (@StudentMirzoeva, '2026-09-02', 2, N'Присутствовал');

IF @StudentKuznetsov IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Attendance WHERE StudentID = @StudentKuznetsov AND [Day] = '2026-09-03' AND PairNumber = 3)
    INSERT INTO dbo.Attendance (StudentID, [Day], PairNumber, Mark)
    VALUES (@StudentKuznetsov, '2026-09-03', 3, N'Был на паре');

IF @StudentSidorov IS NOT NULL AND @SubjectProgramming IS NOT NULL AND @TeacherIvanova IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Performance WHERE StudentID = @StudentSidorov AND SubjectID = @SubjectProgramming AND TeacherID = @TeacherIvanova AND ControlForm = N'экзамен' AND MarkCode = 4)
    INSERT INTO dbo.Performance (StudentID, SubjectID, TeacherID, ControlForm, Tour, MarkCode)
    VALUES (@StudentSidorov, @SubjectProgramming, @TeacherIvanova, N'экзамен', 1, 4);

IF @StudentMirzoeva IS NOT NULL AND @SubjectWriting IS NOT NULL AND @TeacherPetrova IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Performance WHERE StudentID = @StudentMirzoeva AND SubjectID = @SubjectWriting AND TeacherID = @TeacherPetrova AND ControlForm = N'зачет' AND MarkCode = 3)
    INSERT INTO dbo.Performance (StudentID, SubjectID, TeacherID, ControlForm, Tour, MarkCode)
    VALUES (@StudentMirzoeva, @SubjectWriting, @TeacherPetrova, N'зачет', NULL, 3);

IF @StudentKuznetsov IS NOT NULL AND @SubjectMath IS NOT NULL AND @TeacherKhodjaev IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Performance WHERE StudentID = @StudentKuznetsov AND SubjectID = @SubjectMath AND TeacherID = @TeacherKhodjaev AND ControlForm = N'экзамен' AND MarkCode = 5)
    INSERT INTO dbo.Performance (StudentID, SubjectID, TeacherID, ControlForm, Tour, MarkCode)
    VALUES (@StudentKuznetsov, @SubjectMath, @TeacherKhodjaev, N'экзамен', 1, 5);

IF @StudentAlieva IS NOT NULL AND @SubjectProgramming IS NOT NULL AND @TeacherIvanova IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Performance WHERE StudentID = @StudentAlieva AND SubjectID = @SubjectProgramming AND TeacherID = @TeacherIvanova AND ControlForm = N'зачет' AND MarkCode = 2)
    INSERT INTO dbo.Performance (StudentID, SubjectID, TeacherID, ControlForm, Tour, MarkCode)
    VALUES (@StudentAlieva, @SubjectProgramming, @TeacherIvanova, N'зачет', NULL, 2);
