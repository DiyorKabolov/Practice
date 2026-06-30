require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();

const PORT = Number(process.env.PORT || 3001);
const POWERSHELL_PATH = process.env.POWERSHELL_PATH || 'powershell.exe';
const SQL_SERVER_CANDIDATES = Array.from(new Set([
  process.env.SQL_SERVER,
  'localhost\\SQLEXPRESS',
  'localhost',
  '.\\SQLEXPRESS',
].filter(Boolean)));
const SQL_DATABASE = process.env.SQL_DATABASE || 'MSUPractice';
const SCHEMA_FILE = path.join(__dirname, 'create_university_tables.sql');
const SEED_FILE = path.join(__dirname, 'seed_msu_site.sql');
const BOOTSTRAP_MARKER_TABLE = 'dbo.__AppBootstrap';
let activeSqlServer = SQL_SERVER_CANDIDATES[0] || 'localhost\\SQLEXPRESS';
const POWERSHELL_SQL_WORKER_SCRIPT = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Decode-Base64String([string]$value) {
  return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($value))
}

function Encode-Base64String([string]$value) {
  return [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($value))
}

while (($line = [Console]::In.ReadLine()) -ne $null) {
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  $request = $null
  try {
    $requestJson = Decode-Base64String $line
    $request = $requestJson | ConvertFrom-Json

    $connection = New-Object System.Data.SqlClient.SqlConnection $request.connectionString
    try {
      $connection.Open()
      $command = $connection.CreateCommand()
      try {
        $command.CommandTimeout = 0
        $command.CommandText = $request.query
        if ($request.mode -eq 'scalar') {
          $result = $command.ExecuteScalar()
          $stdoutText = if ($null -ne $result -and $result -ne [DBNull]::Value) { [string]$result } else { '' }
        } else {
          $null = $command.ExecuteNonQuery()
          $stdoutText = ''
        }
      } finally {
        if ($command) {
          $command.Dispose()
        }
      }
    } finally {
      $connection.Dispose()
    }

    $response = [pscustomobject]@{
      id = $request.id
      ok = $true
      stdout = Encode-Base64String $stdoutText
      stderr = ''
    }
  } catch {
    $errorText = $_.Exception.Message
    if ($null -ne $request) {
      $response = [pscustomobject]@{
        id = $request.id
        ok = $false
        stdout = ''
        stderr = Encode-Base64String $errorText
      }
    } else {
      continue
    }
  }

  [Console]::Out.WriteLine(($response | ConvertTo-Json -Compress -Depth 5))
}
`;

app.use(express.json());

// Serve production build if dist exists and not in dev mode
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const tableDefs = {
  auditories: {
    table: 'dbo.Auditories',
    id: 'AuditoryID',
    fields: [
      { name: 'RoomNumber', type: 'string' },
      { name: 'RoomType', type: 'string' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        AuditoryID,
        RoomNumber,
        RoomType
      FROM dbo.Auditories
      ORDER BY AuditoryID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  subjects: {
    table: 'dbo.Subjects',
    id: 'SubjectID',
    fields: [
      { name: 'SubjectName', type: 'string' },
      { name: 'Semester', type: 'int' },
      { name: 'HoursCount', type: 'int' },
      { name: 'ControlForm', type: 'string' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        SubjectID,
        SubjectName,
        Semester,
        HoursCount,
        ControlForm
      FROM dbo.Subjects
      ORDER BY SubjectID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  specialties: {
    table: 'dbo.Specialties',
    id: 'SpecialtyID',
    fields: [
      { name: 'SpecialtyCode', type: 'string' },
      { name: 'SpecialtyName', type: 'string' },
      { name: 'Faculty', type: 'string' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        SpecialtyID,
        SpecialtyCode,
        SpecialtyName,
        Faculty
      FROM dbo.Specialties
      ORDER BY SpecialtyID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  groups: {
    table: 'dbo.[Groups]',
    id: 'GroupID',
    fields: [
      { name: 'GroupName', type: 'string' },
      { name: 'SpecialtyID', type: 'int' },
      { name: 'Course', type: 'int' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        g.GroupID,
        g.GroupName,
        g.SpecialtyID,
        CONCAT(s.SpecialtyCode, N' ', s.SpecialtyName) AS SpecialtyDisplay,
        g.Course
      FROM dbo.[Groups] g
      INNER JOIN dbo.Specialties s ON s.SpecialtyID = g.SpecialtyID
      ORDER BY g.GroupID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  teachers: {
    table: 'dbo.Teachers',
    id: 'TeacherID',
    fields: [
      { name: 'LastName', type: 'string' },
      { name: 'FirstName', type: 'string' },
      { name: 'MiddleName', type: 'string' },
      { name: 'AcademicDegree', type: 'string' },
      { name: 'AcademicTitle', type: 'string' },
      { name: 'Position', type: 'string' },
      { name: 'Phone', type: 'string' },
      { name: 'Address', type: 'string' },
      { name: 'Email', type: 'string' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        TeacherID,
        LastName,
        FirstName,
        MiddleName,
        AcademicDegree,
        AcademicTitle,
        Position,
        Phone,
        Address,
        Email
      FROM dbo.Teachers
      ORDER BY TeacherID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  students: {
    table: 'dbo.Students',
    id: 'StudentID',
    fields: [
      { name: 'LastName', type: 'string' },
      { name: 'FirstName', type: 'string' },
      { name: 'MiddleName', type: 'string' },
      { name: 'GroupID', type: 'int' },
      { name: 'Phone', type: 'string' },
      { name: 'Address', type: 'string' },
      { name: 'Email', type: 'string' },
      { name: 'BirthDate', type: 'date' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        s.StudentID,
        s.LastName,
        s.FirstName,
        s.MiddleName,
        s.GroupID,
        g.GroupName,
        s.Phone,
        s.Address,
        s.Email,
        CONVERT(varchar(10), s.BirthDate, 23) AS BirthDate
      FROM dbo.Students s
      INNER JOIN dbo.[Groups] g ON g.GroupID = s.GroupID
      ORDER BY s.StudentID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  discipline: {
    table: 'dbo.Discipline',
    id: 'DisciplineID',
    fields: [
      { name: 'SubjectID', type: 'int' },
      { name: 'TeacherID', type: 'int' },
      { name: 'GroupID', type: 'int' },
      { name: 'LectureHours', type: 'int' },
      { name: 'PracticalHours', type: 'int' },
      { name: 'LaboratoryHours', type: 'int' },
      { name: 'OtherWorkHours', type: 'int' },
      { name: 'ControlHours', type: 'decimal' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        d.DisciplineID,
        d.SubjectID,
        s.SubjectName,
        d.TeacherID,
        CONCAT(t.LastName, N' ', t.FirstName, CASE WHEN t.MiddleName IS NULL OR t.MiddleName = N'' THEN N'' ELSE N' ' + t.MiddleName END) AS TeacherName,
        d.GroupID,
        g.GroupName,
        d.LectureHours,
        d.PracticalHours,
        d.LaboratoryHours,
        d.OtherWorkHours,
        s.ControlForm,
        d.ControlHours,
        v.CalculatedControlHours
      FROM dbo.Discipline d
      INNER JOIN dbo.Subjects s ON s.SubjectID = d.SubjectID
      INNER JOIN dbo.Teachers t ON t.TeacherID = d.TeacherID
      INNER JOIN dbo.[Groups] g ON g.GroupID = d.GroupID
      LEFT JOIN dbo.v_DisciplineWithControlHours v ON v.DisciplineID = d.DisciplineID
      ORDER BY d.DisciplineID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  weeks: {
    table: 'dbo.Weeks',
    id: 'WeekID',
    fields: [
      { name: 'WeekName', type: 'string' },
      { name: 'StartDate', type: 'date' },
      { name: 'EndDate', type: 'date' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        WeekID,
        WeekName,
        CONVERT(varchar(10), StartDate, 23) AS StartDate,
        CONVERT(varchar(10), EndDate, 23) AS EndDate
      FROM dbo.Weeks
      ORDER BY WeekID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  attendance: {
    table: 'dbo.Attendance',
    id: 'AttendanceID',
    fields: [
      { name: 'StudentID', type: 'int' },
      { name: 'Day', type: 'date' },
      { name: 'PairNumber', type: 'int' },
      { name: 'Mark', type: 'string' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        a.AttendanceID,
        a.StudentID,
        CONCAT(s.LastName, N' ', s.FirstName, CASE WHEN s.MiddleName IS NULL OR s.MiddleName = N'' THEN N'' ELSE N' ' + s.MiddleName END) AS StudentName,
        CONVERT(varchar(10), a.[Day], 23) AS [Day],
        a.PairNumber,
        a.Mark
      FROM dbo.Attendance a
      INNER JOIN dbo.Students s ON s.StudentID = a.StudentID
      ORDER BY a.AttendanceID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  performance: {
    table: 'dbo.Performance',
    id: 'PerformanceID',
    fields: [
      { name: 'StudentID', type: 'int' },
      { name: 'SubjectID', type: 'int' },
      { name: 'TeacherID', type: 'int' },
      { name: 'ControlForm', type: 'string' },
      { name: 'Tour', type: 'int' },
      { name: 'MarkCode', type: 'int' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        p.PerformanceID,
        p.StudentID,
        CONCAT(st.LastName, N' ', st.FirstName, CASE WHEN st.MiddleName IS NULL OR st.MiddleName = N'' THEN N'' ELSE N' ' + st.MiddleName END) AS StudentName,
        p.SubjectID,
        s.SubjectName AS DisciplineName,
        p.TeacherID,
        CONCAT(t.LastName, N' ', t.FirstName, CASE WHEN t.MiddleName IS NULL OR t.MiddleName = N'' THEN N'' ELSE N' ' + t.MiddleName END) AS TeacherName,
        p.ControlForm,
        p.Tour,
        p.MarkCode,
        CASE
          WHEN LOWER(LTRIM(RTRIM(p.ControlForm))) = N'зачет' THEN
            CASE p.MarkCode
              WHEN 0 THEN N'0 - недоп'
              WHEN 1 THEN N'1 - неявка'
              WHEN 2 THEN N'2 - незачет'
              WHEN 3 THEN N'3 - зачет'
              ELSE CONCAT(CAST(p.MarkCode AS NVARCHAR(10)), N' - ?')
            END
          WHEN LOWER(LTRIM(RTRIM(p.ControlForm))) = N'экзамен' THEN
            CASE p.MarkCode
              WHEN 0 THEN N'0 - недоп'
              WHEN 1 THEN N'1 - неявка'
              WHEN 2 THEN N'2 - неуд'
              WHEN 3 THEN N'3 - уд'
              WHEN 4 THEN N'4 - хор'
              WHEN 5 THEN N'5 - отл'
              ELSE CONCAT(CAST(p.MarkCode AS NVARCHAR(10)), N' - ?')
            END
          ELSE CAST(p.MarkCode AS NVARCHAR(10))
        END AS MarkDisplay
      FROM dbo.Performance p
      INNER JOIN dbo.Students st ON st.StudentID = p.StudentID
      INNER JOIN dbo.Subjects s ON s.SubjectID = p.SubjectID
      INNER JOIN dbo.Teachers t ON t.TeacherID = p.TeacherID
      ORDER BY p.PerformanceID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  execution: {
    table: 'dbo.Execution',
    id: 'ExecutionID',
    fields: [
      { name: 'TeacherID', type: 'int' },
      { name: 'SubjectID', type: 'int' },
      { name: 'LectureHours', type: 'int' },
      { name: 'PracticalHours', type: 'int' },
      { name: 'LaboratoryHours', type: 'int' },
      { name: 'OtherWorkHours', type: 'int' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        e.ExecutionID,
        e.TeacherID,
        CONCAT(t.LastName, N' ', t.FirstName, CASE WHEN t.MiddleName IS NULL OR t.MiddleName = N'' THEN N'' ELSE N' ' + t.MiddleName END) AS TeacherName,
        e.SubjectID,
        s.SubjectName AS DisciplineName,
        e.LectureHours,
        e.PracticalHours,
        e.LaboratoryHours,
        e.OtherWorkHours
      FROM dbo.Execution e
      INNER JOIN dbo.Teachers t ON t.TeacherID = e.TeacherID
      INNER JOIN dbo.Subjects s ON s.SubjectID = e.SubjectID
      ORDER BY e.ExecutionID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
  schedule: {
    table: 'dbo.Schedule',
    id: 'ScheduleID',
    fields: [
      { name: 'Day', type: 'string' },
      { name: 'PairNumber', type: 'int' },
      { name: 'SubjectID', type: 'int' },
      { name: 'TeacherID', type: 'int' },
      { name: 'LessonType', type: 'string' },
      { name: 'AuditoryID', type: 'int' },
      { name: 'GroupID', type: 'int' },
    ],
    listQuery: `
      SET NOCOUNT ON;
      SELECT
        sc.ScheduleID,
        sc.[Day],
        sc.PairNumber,
        sc.SubjectID,
        s.SubjectName,
        sc.TeacherID,
        CONCAT(t.LastName, N' ', t.FirstName, CASE WHEN t.MiddleName IS NULL OR t.MiddleName = N'' THEN N'' ELSE N' ' + t.MiddleName END) AS TeacherName,
        sc.LessonType,
        sc.AuditoryID,
        a.RoomNumber AS RoomName,
        sc.GroupID,
        g.GroupName
      FROM dbo.Schedule sc
      INNER JOIN dbo.Subjects s ON s.SubjectID = sc.SubjectID
      INNER JOIN dbo.Teachers t ON t.TeacherID = sc.TeacherID
      INNER JOIN dbo.Auditories a ON a.AuditoryID = sc.AuditoryID
      INNER JOIN dbo.[Groups] g ON g.GroupID = sc.GroupID
      ORDER BY sc.ScheduleID
      FOR JSON PATH, INCLUDE_NULL_VALUES;
    `,
  },
};

function decodeBufferText(raw) {
  if (!raw || raw.length === 0) {
    return '';
  }

  if (raw.length >= 2 && raw[0] === 0xFF && raw[1] === 0xFE) {
    return raw.toString('utf16le').replace(/^\uFEFF/, '');
  }

  let oddZeroBytes = 0;
  for (let i = 1; i < raw.length; i += 2) {
    if (raw[i] === 0x00) {
      oddZeroBytes += 1;
    }
  }

  if (oddZeroBytes > Math.max(8, raw.length / 8)) {
    return raw.toString('utf16le').replace(/^\uFEFF/, '');
  }

  return raw.toString('utf8').replace(/^\uFEFF/, '');
}

const CP1252_REVERSE = new Map([
  [0x20AC, 0x80],
  [0x201A, 0x82],
  [0x0192, 0x83],
  [0x201E, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02C6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8A],
  [0x2039, 0x8B],
  [0x0152, 0x8C],
  [0x017D, 0x8E],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201C, 0x93],
  [0x201D, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02DC, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9A],
  [0x203A, 0x9B],
  [0x0153, 0x9C],
  [0x017E, 0x9E],
  [0x0178, 0x9F],
]);

function repairMojibakeString(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  const bytes = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0x7F) {
      bytes.push(codePoint);
      continue;
    }

    if (codePoint >= 0x80 && codePoint <= 0x9F) {
      bytes.push(codePoint);
      continue;
    }

    if (codePoint >= 0xA0 && codePoint <= 0xFF) {
      bytes.push(codePoint);
      continue;
    }

    const byte = CP1252_REVERSE.get(codePoint);
    if (byte === undefined) {
      return value;
    }

    bytes.push(byte);
  }

  try {
    return new TextDecoder('utf-8').decode(Uint8Array.from(bytes));
  } catch (_error) {
    return value;
  }
}

function repairMojibakeValue(value) {
  if (typeof value === 'string') {
    return repairMojibakeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(repairMojibakeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, repairMojibakeValue(entry)])
    );
  }

  return value;
}

function sqlQuote(value, type) {
  if (value === undefined || value === null || value === '') {
    return 'NULL';
  }

  if (type === 'int') {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) {
      throw new Error(`Invalid integer value: ${value}`);
    }
    return String(n);
  }

  if (type === 'decimal') {
    const n = Number.parseFloat(value);
    if (Number.isNaN(n)) {
      throw new Error(`Invalid decimal value: ${value}`);
    }
    return String(n);
  }

  if (type === 'date') {
    const text = String(value).trim();
    return text ? `CONVERT(date, N'${text.replace(/'/g, "''")}', 23)` : 'NULL';
  }

  return `N'${String(value).replace(/'/g, "''")}'`;
}

function buildInsertQuery(def, body) {
  const columns = def.fields.map((field) => `[${field.name}]`).join(', ');
  const values = def.fields.map((field) => sqlQuote(body[field.name], field.type)).join(', ');
  return `
    SET NOCOUNT ON;
    INSERT INTO ${def.table} (${columns})
    VALUES (${values});
  `;
}

function buildUpdateQuery(def, id, body) {
  const sets = def.fields
    .map((field) => `[${field.name}] = ${sqlQuote(body[field.name], field.type)}`)
    .join(', ');

  return `
    SET NOCOUNT ON;
    UPDATE ${def.table}
    SET ${sets}
    WHERE [${def.id}] = ${sqlQuote(id, 'int')};
  `;
}

function buildDeleteQuery(def, id) {
  return `
    SET NOCOUNT ON;
    DELETE FROM ${def.table}
    WHERE [${def.id}] = ${sqlQuote(id, 'int')};
  `;
}

function escapeSqlLiteral(value) {
  return String(value).replace(/'/g, "''");
}

function encodeBase64Text(value) {
  return Buffer.from(String(value ?? ''), 'utf8').toString('base64');
}

function decodeBase64Text(value) {
  return Buffer.from(String(value ?? ''), 'base64').toString('utf8');
}

function buildConnectionString(database) {
  return [
    `Server=${activeSqlServer}`,
    `Database=${database}`,
    'Integrated Security=True',
    'TrustServerCertificate=True',
    'Encrypt=False',
  ].join(';') + ';';
}

class SqlWorker {
  constructor() {
    this.nextId = 1;
    this.pending = new Map();
    this.stdoutBuffer = '';
    this.proc = spawn(POWERSHELL_PATH, [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      POWERSHELL_SQL_WORKER_SCRIPT,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    this.ready = new Promise((resolve, reject) => {
      this.proc.once('spawn', resolve);
      this.proc.once('error', reject);
    });

    this.proc.stdout.on('data', (chunk) => {
      this.stdoutBuffer += chunk.toString('utf8');
      let newlineIndex;

      while ((newlineIndex = this.stdoutBuffer.indexOf('\n')) !== -1) {
        const line = this.stdoutBuffer.slice(0, newlineIndex).replace(/\r$/, '').trim();
        this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);

        if (!line) {
          continue;
        }

        this.handleResponse(line);
      }
    });

    this.proc.stderr.on('data', (chunk) => {
      const message = chunk.toString('utf8').trim();
      if (message) {
        console.error('[sql-worker]', message);
      }
    });

    this.proc.on('exit', (code, signal) => {
      const error = new Error(`SQL worker exited${code !== null ? ` with code ${code}` : ''}${signal ? ` (${signal})` : ''}`);
      for (const pending of this.pending.values()) {
        pending.reject(error);
      }
      this.pending.clear();
    });
  }

  handleResponse(line) {
    let response;
    try {
      response = JSON.parse(line);
    } catch (error) {
      for (const pending of this.pending.values()) {
        pending.reject(error);
      }
      this.pending.clear();
      return;
    }

    const pending = this.pending.get(response.id);
    if (!pending) {
      return;
    }

    this.pending.delete(response.id);

    if (response.ok) {
      pending.resolve(Buffer.from(response.stdout || '', 'base64'));
      return;
    }

    pending.reject(new Error(decodeBase64Text(response.stderr) || 'SQL worker request failed'));
  }

  async request(query, database = SQL_DATABASE, mode = 'scalar') {
    await this.ready;
    const id = this.nextId++;
    const payload = {
      id,
      connectionString: buildConnectionString(database),
      query,
      mode,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const ok = this.proc.stdin.write(`${encodeBase64Text(JSON.stringify(payload))}\n`);
      if (!ok) {
        this.proc.stdin.once('drain', () => {});
      }
    });
  }
}

let sqlWorker = null;

function getSqlWorker() {
  if (!sqlWorker) {
    sqlWorker = new SqlWorker();
  }
  return sqlWorker;
}

async function execSqlText(query, database = SQL_DATABASE, mode = 'scalar') {
  return getSqlWorker().request(query, database, mode);
}

function splitSqlBatches(script) {
  return String(script)
    .replace(/^\uFEFF/, '')
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

async function runSqlFile(file, database = SQL_DATABASE) {
  const script = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  for (const batch of splitSqlBatches(script)) {
    await execSqlText(batch, database, 'nonquery');
  }
}

function listenAsync(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

async function isApiAlreadyRunning(port = PORT) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/meta/tables`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function buildRepairRowsQuery(def) {
  const columns = [def.id, ...def.fields.map((field) => field.name)]
    .map((column) => `[${column}]`)
    .join(', ');

  return `
    SET NOCOUNT ON;
    SELECT ${columns}
    FROM ${def.table}
    ORDER BY [${def.id}]
    FOR JSON PATH, INCLUDE_NULL_VALUES;
  `;
}

async function repairStoredStrings() {
  let updatedRows = 0;

  for (const def of Object.values(tableDefs)) {
    const rows = await queryJsonRaw(buildRepairRowsQuery(def));

    for (const row of rows) {
      const repairedBody = {};
      let needsUpdate = false;

      for (const field of def.fields) {
        const repairedValue = repairMojibakeValue(row[field.name]);
        repairedBody[field.name] = repairedValue;

        if (repairedValue !== row[field.name]) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await execSqlText(buildUpdateQuery(def, row[def.id], repairedBody), SQL_DATABASE, 'nonquery');
        updatedRows += 1;
      }
    }
  }

  return updatedRows;
}

async function isBootstrapComplete() {
  const text = decodeBufferText(await execSqlText(`
    SET NOCOUNT ON;
    SELECT CASE
      WHEN OBJECT_ID(N'${escapeSqlLiteral(BOOTSTRAP_MARKER_TABLE)}', N'U') IS NULL THEN 0
      ELSE 1
    END AS IsBootstrapped;
  `));

  return text.trim() === '1';
}

async function markBootstrapComplete() {
  await execSqlText(`
    SET NOCOUNT ON;
    IF OBJECT_ID(N'${escapeSqlLiteral(BOOTSTRAP_MARKER_TABLE)}', N'U') IS NULL
    BEGIN
      CREATE TABLE ${BOOTSTRAP_MARKER_TABLE} (
        BootstrapID INT NOT NULL CONSTRAINT PK___AppBootstrap PRIMARY KEY,
        AppliedAt DATETIME2 NOT NULL CONSTRAINT DF___AppBootstrap_AppliedAt DEFAULT SYSUTCDATETIME()
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM ${BOOTSTRAP_MARKER_TABLE} WHERE BootstrapID = 1)
    BEGIN
      INSERT INTO ${BOOTSTRAP_MARKER_TABLE} (BootstrapID) VALUES (1);
    END;
  `, SQL_DATABASE, 'nonquery');
}

async function queryJson(query) {
  const text = decodeBufferText(await execSqlText(query));
  if (!text) {
    return [];
  }

  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows;
}

async function queryJsonRaw(query) {
  const text = decodeBufferText(await execSqlText(query));
  if (!text) {
    return [];
  }

  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function getDef(name) {
  return tableDefs[String(name || '').toLowerCase()];
}

async function canConnect(server) {
  const previousServer = activeSqlServer;
  activeSqlServer = server;
  try {
    const text = decodeBufferText(await execSqlText('SELECT 1 AS ok;', 'master'));
    return text.trim() === '1';
  } catch (_error) {
    return false;
  } finally {
    activeSqlServer = previousServer;
  }
}

async function resolveSqlServer() {
  for (const candidate of SQL_SERVER_CANDIDATES) {
    if (await canConnect(candidate)) {
      activeSqlServer = candidate;
      return candidate;
    }
  }
  throw new Error(
    `Не удалось подключиться к SQL Server. Проверенные варианты: ${SQL_SERVER_CANDIDATES.join(', ')}`
  );
}

async function bootstrapDatabase() {
  await resolveSqlServer();

  await execSqlText(`
    IF DB_ID(N'${SQL_DATABASE.replace(/'/g, "''")}') IS NULL
    BEGIN
      CREATE DATABASE [${SQL_DATABASE.replace(/]/g, ']]')}];
    END
  `, 'master', 'nonquery');

  if (await isBootstrapComplete()) {
    return;
  }

  await runSqlFile(SCHEMA_FILE, SQL_DATABASE);
  await runSqlFile(SEED_FILE, SQL_DATABASE);
  await repairStoredStrings();
  await markBootstrapComplete();
}

app.get('/api/lookups', async (_req, res) => {
  try {
    const [specialties, subjects, groups, teachers, auditories, students] = await Promise.all([
      queryJson(`
        SET NOCOUNT ON;
        SELECT
          SpecialtyID AS id,
          CONCAT(SpecialtyCode, N' ', SpecialtyName, N' (', Faculty, N')') AS label
        FROM dbo.Specialties
        ORDER BY SpecialtyCode
        FOR JSON PATH, INCLUDE_NULL_VALUES;
      `),
      queryJson(`
        SET NOCOUNT ON;
        SELECT
          SubjectID AS id,
          SubjectName AS label
        FROM dbo.Subjects
        ORDER BY SubjectName
        FOR JSON PATH, INCLUDE_NULL_VALUES;
      `),
      queryJson(`
        SET NOCOUNT ON;
        SELECT
          g.GroupID AS id,
          CONCAT(g.GroupName, N' (', s.SpecialtyCode, N')') AS label
        FROM dbo.[Groups] g
        INNER JOIN dbo.Specialties s ON s.SpecialtyID = g.SpecialtyID
        ORDER BY g.GroupName
        FOR JSON PATH, INCLUDE_NULL_VALUES;
      `),
      queryJson(`
        SET NOCOUNT ON;
        SELECT
          TeacherID AS id,
          CONCAT(LastName, N' ', FirstName, CASE WHEN MiddleName IS NULL OR MiddleName = N'' THEN N'' ELSE N' ' + MiddleName END) AS label
        FROM dbo.Teachers
        ORDER BY LastName, FirstName
        FOR JSON PATH, INCLUDE_NULL_VALUES;
      `),
      queryJson(`
        SET NOCOUNT ON;
        SELECT
          AuditoryID AS id,
          CONCAT(RoomNumber, N' ', RoomType) AS label
        FROM dbo.Auditories
        ORDER BY RoomNumber
        FOR JSON PATH, INCLUDE_NULL_VALUES;
      `),
      queryJson(`
        SET NOCOUNT ON;
        SELECT
          s.StudentID AS id,
          CONCAT(s.LastName, N' ', s.FirstName, CASE WHEN s.MiddleName IS NULL OR s.MiddleName = N'' THEN N'' ELSE N' ' + s.MiddleName END, N' (', g.GroupName, N')') AS label
        FROM dbo.Students s
        INNER JOIN dbo.[Groups] g ON g.GroupID = s.GroupID
        ORDER BY s.LastName, s.FirstName
        FOR JSON PATH, INCLUDE_NULL_VALUES;
      `),
    ]);

    res.json({ specialties, subjects, groups, teachers, auditories, students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/:table', async (req, res) => {
  const def = getDef(req.params.table);
  if (!def) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  try {
    const rows = await queryJson(def.listQuery);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:table', async (req, res) => {
  const def = getDef(req.params.table);
  if (!def) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  try {
    await execSqlText(buildInsertQuery(def, req.body || {}), SQL_DATABASE, 'nonquery');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/:table/:id', async (req, res) => {
  const def = getDef(req.params.table);
  if (!def) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  try {
    await execSqlText(buildUpdateQuery(def, req.params.id, req.body || {}), SQL_DATABASE, 'nonquery');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:table/:id', async (req, res) => {
  const def = getDef(req.params.table);
  if (!def) {
    return res.status(404).json({ error: 'Unknown table' });
  }

  try {
    await execSqlText(buildDeleteQuery(def, req.params.id), SQL_DATABASE, 'nonquery');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meta/tables', (_req, res) => {
  const meta = Object.entries(tableDefs).map(([name, def]) => ({
    name,
    label: def.table,
    id: def.id,
    fields: def.fields,
  }));
  res.json(meta);
});

// Fallback to index.html for SPA routing (production only)
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('API server running. Use Vite dev server for the frontend.');
  }
});

async function start() {
  try {
    console.log('Bootstrapping database...');
    await bootstrapDatabase();
    try {
      await listenAsync(PORT);
      console.log(`MSU tables app running at http://localhost:${PORT}`);
    } catch (error) {
      if (error && error.code === 'EADDRINUSE' && await isApiAlreadyRunning(PORT)) {
        console.log(`MSU tables app running at http://localhost:${PORT}`);
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to start application:');
    const stderr = decodeBufferText(error.stderr).trim();
    console.error(stderr || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = {
  app,
  start,
  tableDefs,
  sqlQuote,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
};
