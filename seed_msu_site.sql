-- Idempotent starter data for the MSU practice database.

IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE SpecialtyCode = N'01.03.02')
    INSERT INTO dbo.Specialties (SpecialtyCode, SpecialtyName, Faculty)
    VALUES (N'01.03.02', N'Прикладная математика и информатика', N'Естественнонаучный факультет');

IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE SpecialtyCode = N'04.03.02')
    INSERT INTO dbo.Specialties (SpecialtyCode, SpecialtyName, Faculty)
    VALUES (N'04.03.02', N'Химия, физика и механика материалов', N'Естественнонаучный факультет');

IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE SpecialtyCode = N'05.03.01')
    INSERT INTO dbo.Specialties (SpecialtyCode, SpecialtyName, Faculty)
    VALUES (N'05.03.01', N'Геология', N'Естественнонаучный факультет');

IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE SpecialtyCode = N'38.03.04')
    INSERT INTO dbo.Specialties (SpecialtyCode, SpecialtyName, Faculty)
    VALUES (N'38.03.04', N'Государственное и муниципальное управление', N'Гуманитарный факультет');

IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE SpecialtyCode = N'41.03.05')
    INSERT INTO dbo.Specialties (SpecialtyCode, SpecialtyName, Faculty)
    VALUES (N'41.03.05', N'Международные отношения', N'Гуманитарный факультет');

IF NOT EXISTS (SELECT 1 FROM dbo.Specialties WHERE SpecialtyCode = N'45.03.02')
    INSERT INTO dbo.Specialties (SpecialtyCode, SpecialtyName, Faculty)
    VALUES (N'45.03.02', N'Лингвистика', N'Гуманитарный факультет');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Базы данных')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Базы данных', 4, 144, N'экзамен');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Алгоритмы и структуры данных')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Алгоритмы и структуры данных', 3, 144, N'экзамен');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Иностранный язык')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Иностранный язык', 2, 108, N'зачет');

IF NOT EXISTS (SELECT 1 FROM dbo.Subjects WHERE SubjectName = N'Экономика')
    INSERT INTO dbo.Subjects (SubjectName, Semester, HoursCount, ControlForm)
    VALUES (N'Экономика', 1, 72, N'зачет');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'101')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'101', N'Лекционная');

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'204')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'204', N'Компьютерный класс');

IF NOT EXISTS (SELECT 1 FROM dbo.Auditories WHERE RoomNumber = N'310')
    INSERT INTO dbo.Auditories (RoomNumber, RoomType)
    VALUES (N'310', N'Лаборатория');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Одинабеков' AND FirstName = N'Джасур')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Одинабеков', N'Джасур', N'Музаффирович', N'кандидат физико-математических наук', N'доцент', N'заведующий кафедрой', NULL, NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Казиджанова' AND FirstName = N'Нодира')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Казиджанова', N'Нодира', N'Маърифатовна', N'кандидат технических наук', N'доцент', N'доцент кафедры', NULL, NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Teachers WHERE LastName = N'Смирнов' AND FirstName = N'Кирилл')
    INSERT INTO dbo.Teachers
    (LastName, FirstName, MiddleName, AcademicDegree, AcademicTitle, Position, Phone, Address, Email)
    VALUES
    (N'Смирнов', N'Кирилл', N'Константинович', NULL, N'старший преподаватель', N'старший преподаватель', NULL, NULL, NULL);
GO

DECLARE @SpecialtyMath INT = (SELECT TOP 1 SpecialtyID FROM dbo.Specialties WHERE SpecialtyCode = N'01.03.02');
DECLARE @SpecialtyLing INT = (SELECT TOP 1 SpecialtyID FROM dbo.Specialties WHERE SpecialtyCode = N'45.03.02');

IF @SpecialtyMath IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Groups] WHERE GroupName = N'ПМИ-21')
    INSERT INTO dbo.[Groups] (GroupName, SpecialtyID, Course)
    VALUES (N'ПМИ-21', @SpecialtyMath, 2);

IF @SpecialtyLing IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.[Groups] WHERE GroupName = N'ЛИН-11')
    INSERT INTO dbo.[Groups] (GroupName, SpecialtyID, Course)
    VALUES (N'ЛИН-11', @SpecialtyLing, 1);
GO

DECLARE @GroupPmi INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ПМИ-21');
DECLARE @GroupLin INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ЛИН-11');

IF @GroupPmi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Каримов' AND FirstName = N'Алишер')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Каримов', N'Алишер', N'Саидович', @GroupPmi, NULL, NULL, N'alisher.karimov@example.com', '2005-02-18');

IF @GroupPmi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Назарова' AND FirstName = N'Мадина')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Назарова', N'Мадина', N'Фарходовна', @GroupPmi, NULL, NULL, N'madina.nazarova@example.com', '2004-11-03');

IF @GroupLin IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Students WHERE LastName = N'Сафаров' AND FirstName = N'Рустам')
    INSERT INTO dbo.Students (LastName, FirstName, MiddleName, GroupID, Phone, Address, Email, BirthDate)
    VALUES (N'Сафаров', N'Рустам', N'Шухратович', @GroupLin, NULL, NULL, N'rustam.safarov@example.com', '2005-07-29');
GO

DECLARE @SubjectDb INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Базы данных');
DECLARE @SubjectLang INT = (SELECT TOP 1 SubjectID FROM dbo.Subjects WHERE SubjectName = N'Иностранный язык');
DECLARE @TeacherOdin INT = (SELECT TOP 1 TeacherID FROM dbo.Teachers WHERE LastName = N'Одинабеков');
DECLARE @TeacherSmirnov INT = (SELECT TOP 1 TeacherID FROM dbo.Teachers WHERE LastName = N'Смирнов');
DECLARE @GroupPmi2 INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ПМИ-21');
DECLARE @GroupLin2 INT = (SELECT TOP 1 GroupID FROM dbo.[Groups] WHERE GroupName = N'ЛИН-11');

IF @SubjectDb IS NOT NULL AND @TeacherOdin IS NOT NULL AND @GroupPmi2 IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Discipline WHERE SubjectID = @SubjectDb AND TeacherID = @TeacherOdin AND GroupID = @GroupPmi2)
    INSERT INTO dbo.Discipline (SubjectID, TeacherID, GroupID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours, ControlHours)
    VALUES (@SubjectDb, @TeacherOdin, @GroupPmi2, 32, 24, 20, 12, NULL);

IF @SubjectLang IS NOT NULL AND @TeacherSmirnov IS NOT NULL AND @GroupLin2 IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Discipline WHERE SubjectID = @SubjectLang AND TeacherID = @TeacherSmirnov AND GroupID = @GroupLin2)
    INSERT INTO dbo.Discipline (SubjectID, TeacherID, GroupID, LectureHours, PracticalHours, LaboratoryHours, OtherWorkHours, ControlHours)
    VALUES (@SubjectLang, @TeacherSmirnov, @GroupLin2, 18, 36, 0, 8, NULL);
GO
