-- Idempotent schema for MS SQL Server.

IF OBJECT_ID('dbo.Auditories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Auditories
    (
        AuditoryID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Auditories PRIMARY KEY,
        RoomNumber NVARCHAR(20) NOT NULL,
        RoomType NVARCHAR(20) NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.Subjects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Subjects
    (
        SubjectID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Subjects PRIMARY KEY,
        SubjectName NVARCHAR(200) NOT NULL,
        Semester TINYINT NOT NULL,
        HoursCount INT NOT NULL,
        ControlForm NVARCHAR(50) NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.Specialties', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Specialties
    (
        SpecialtyID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Specialties PRIMARY KEY,
        SpecialtyCode NVARCHAR(20) NOT NULL CONSTRAINT UQ_Specialties_Code UNIQUE,
        SpecialtyName NVARCHAR(200) NOT NULL,
        Faculty NVARCHAR(200) NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.[Groups]', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Groups]
    (
        GroupID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Groups PRIMARY KEY,
        GroupName NVARCHAR(50) NOT NULL,
        SpecialtyID INT NOT NULL,
        Course TINYINT NOT NULL,
        CONSTRAINT FK_Groups_Specialties
            FOREIGN KEY (SpecialtyID) REFERENCES dbo.Specialties(SpecialtyID)
    );
END
GO

IF OBJECT_ID('dbo.Teachers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Teachers
    (
        TeacherID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Teachers PRIMARY KEY,
        LastName NVARCHAR(100) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        MiddleName NVARCHAR(100) NULL,
        AcademicDegree NVARCHAR(100) NULL,
        AcademicTitle NVARCHAR(100) NULL,
        Position NVARCHAR(100) NULL,
        Phone NVARCHAR(20) NULL,
        Address NVARCHAR(250) NULL,
        Email NVARCHAR(150) NULL
    );
END
GO

IF OBJECT_ID('dbo.Students', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Students
    (
        StudentID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Students PRIMARY KEY,
        LastName NVARCHAR(100) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        MiddleName NVARCHAR(100) NULL,
        GroupID INT NOT NULL,
        Phone NVARCHAR(20) NULL,
        Address NVARCHAR(250) NULL,
        Email NVARCHAR(150) NULL,
        BirthDate DATE NULL,
        CONSTRAINT FK_Students_Groups
            FOREIGN KEY (GroupID) REFERENCES dbo.[Groups](GroupID)
    );
END
GO

IF OBJECT_ID('dbo.Discipline', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Discipline
    (
        DisciplineID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Discipline PRIMARY KEY,
        SubjectID INT NOT NULL,
        TeacherID INT NOT NULL,
        GroupID INT NOT NULL,
        LectureHours INT NOT NULL CONSTRAINT DF_Discipline_LectureHours DEFAULT(0),
        PracticalHours INT NOT NULL CONSTRAINT DF_Discipline_PracticalHours DEFAULT(0),
        LaboratoryHours INT NOT NULL CONSTRAINT DF_Discipline_LaboratoryHours DEFAULT(0),
        OtherWorkHours INT NOT NULL CONSTRAINT DF_Discipline_OtherWorkHours DEFAULT(0),
        ControlHours DECIMAL(6,2) NULL,
        CONSTRAINT FK_Discipline_Subjects
            FOREIGN KEY (SubjectID) REFERENCES dbo.Subjects(SubjectID),
        CONSTRAINT FK_Discipline_Teachers
            FOREIGN KEY (TeacherID) REFERENCES dbo.Teachers(TeacherID),
        CONSTRAINT FK_Discipline_Groups
            FOREIGN KEY (GroupID) REFERENCES dbo.[Groups](GroupID)
    );
END
GO

IF OBJECT_ID('dbo.Weeks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Weeks
    (
        WeekID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Weeks PRIMARY KEY,
        WeekName NVARCHAR(100) NOT NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        CONSTRAINT CK_Weeks_DateRange CHECK (StartDate <= EndDate)
    );
END
GO

IF OBJECT_ID('dbo.Attendance', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Attendance
    (
        AttendanceID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Attendance PRIMARY KEY,
        StudentID INT NOT NULL,
        [Day] DATE NOT NULL,
        PairNumber TINYINT NOT NULL,
        Mark NVARCHAR(100) NOT NULL,
        CONSTRAINT FK_Attendance_Students
            FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID)
    );
END
GO

IF OBJECT_ID('dbo.Performance', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Performance
    (
        PerformanceID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Performance PRIMARY KEY,
        StudentID INT NOT NULL,
        SubjectID INT NOT NULL,
        TeacherID INT NOT NULL,
        ControlForm NVARCHAR(20) NOT NULL,
        Tour TINYINT NULL,
        MarkCode TINYINT NOT NULL,
        CONSTRAINT CK_Performance_ControlForm CHECK (ControlForm IN (N'зачет', N'экзамен')),
        CONSTRAINT CK_Performance_MarkCode CHECK (MarkCode BETWEEN 0 AND 5),
        CONSTRAINT FK_Performance_Students
            FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
        CONSTRAINT FK_Performance_Subjects
            FOREIGN KEY (SubjectID) REFERENCES dbo.Subjects(SubjectID),
        CONSTRAINT FK_Performance_Teachers
            FOREIGN KEY (TeacherID) REFERENCES dbo.Teachers(TeacherID)
    );
END
GO

IF OBJECT_ID('dbo.Execution', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Execution
    (
        ExecutionID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Execution PRIMARY KEY,
        TeacherID INT NOT NULL,
        SubjectID INT NOT NULL,
        LectureHours INT NOT NULL CONSTRAINT DF_Execution_LectureHours DEFAULT(0),
        PracticalHours INT NOT NULL CONSTRAINT DF_Execution_PracticalHours DEFAULT(0),
        LaboratoryHours INT NOT NULL CONSTRAINT DF_Execution_LaboratoryHours DEFAULT(0),
        OtherWorkHours INT NOT NULL CONSTRAINT DF_Execution_OtherWorkHours DEFAULT(0),
        CONSTRAINT FK_Execution_Teachers
            FOREIGN KEY (TeacherID) REFERENCES dbo.Teachers(TeacherID),
        CONSTRAINT FK_Execution_Subjects
            FOREIGN KEY (SubjectID) REFERENCES dbo.Subjects(SubjectID)
    );
END
GO

IF OBJECT_ID('dbo.Schedule', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Schedule
    (
        ScheduleID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Schedule PRIMARY KEY,
        [Day] NVARCHAR(30) NOT NULL,
        PairNumber TINYINT NOT NULL,
        SubjectID INT NOT NULL,
        TeacherID INT NOT NULL,
        LessonType NVARCHAR(50) NOT NULL,
        AuditoryID INT NOT NULL,
        GroupID INT NOT NULL,
        CONSTRAINT FK_Schedule_Subjects
            FOREIGN KEY (SubjectID) REFERENCES dbo.Subjects(SubjectID),
        CONSTRAINT FK_Schedule_Teachers
            FOREIGN KEY (TeacherID) REFERENCES dbo.Teachers(TeacherID),
        CONSTRAINT FK_Schedule_Auditories
            FOREIGN KEY (AuditoryID) REFERENCES dbo.Auditories(AuditoryID),
        CONSTRAINT FK_Schedule_Groups
            FOREIGN KEY (GroupID) REFERENCES dbo.[Groups](GroupID)
    );
END
GO

CREATE OR ALTER VIEW dbo.v_DisciplineWithControlHours
AS
SELECT
    d.DisciplineID,
    d.SubjectID,
    d.TeacherID,
    d.GroupID,
    d.LectureHours,
    d.PracticalHours,
    d.LaboratoryHours,
    d.OtherWorkHours,
    s.ControlForm,
    CASE
        WHEN LOWER(LTRIM(RTRIM(s.ControlForm))) = N'зачет'
            THEN CEILING(CAST(COALESCE(scnt.StudentCount, 0) AS DECIMAL(10,2)) * 0.2)
        WHEN LOWER(LTRIM(RTRIM(s.ControlForm))) = N'экзамен'
            THEN CEILING(CAST(COALESCE(scnt.StudentCount, 0) AS DECIMAL(10,2)) * 0.35)
        ELSE d.ControlHours
    END AS CalculatedControlHours
FROM dbo.Discipline d
JOIN dbo.Subjects s
    ON s.SubjectID = d.SubjectID
LEFT JOIN (
    SELECT GroupID, COUNT(*) AS StudentCount
    FROM dbo.Students
    GROUP BY GroupID
) scnt
    ON scnt.GroupID = d.GroupID;
GO
