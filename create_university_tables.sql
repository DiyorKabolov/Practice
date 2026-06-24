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
