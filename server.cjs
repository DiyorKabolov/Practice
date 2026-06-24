require('dotenv').config();

const express = require('express');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const app = express();
const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 3001);
const SQLCMD_PATH = process.env.SQLCMD_PATH || 'sqlcmd';
const SQL_SERVER_CANDIDATES = Array.from(new Set([
  process.env.SQL_SERVER,
  'localhost\\SQLEXPRESS',
  'localhost',
  '.\\SQLEXPRESS',
].filter(Boolean)));
const SQL_DATABASE = process.env.SQL_DATABASE || 'MSUPractice';
const SCHEMA_FILE = path.join(__dirname, 'create_university_tables.sql');
const SEED_FILE = path.join(__dirname, 'seed_msu_site.sql');
let activeSqlServer = SQL_SERVER_CANDIDATES[0] || 'localhost\\SQLEXPRESS';

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
};

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

async function execSqlcmd(query, database = SQL_DATABASE) {
  const result = await execFileAsync(SQLCMD_PATH, [
    '-S',
    activeSqlServer,
    '-d',
    database,
    '-E',
    '-C',
    '-b',
    '-u',
    '-y',
    '0',
    '-Q',
    query,
  ], {
    encoding: 'buffer',
    maxBuffer: 10 * 1024 * 1024,
  });

  const raw = result.stdout;
  if (!raw || raw.length === 0) {
    return null;
  }

  // sqlcmd -u outputs UTF-16LE with a BOM (FF FE).
  // go-sqlcmd outputs UTF-8 (ignores -u).
  let stdout;
  if (raw.length >= 2 && raw[0] === 0xFF && raw[1] === 0xFE) {
    stdout = raw.toString('utf16le').replace(/^\uFEFF/, '');
  } else {
    stdout = raw.toString('utf8').replace(/^\uFEFF/, '');
  }

  // sqlcmd breaks long FOR JSON output into chunks with newlines.
  // We must strip ALL raw newlines (real newlines in data are escaped by SQL as \r\n).
  stdout = stdout.replace(/\r?\n/g, '').trim();

  if (!stdout) {
    return null;
  }
  return stdout;
}

async function runSqlFile(file, database = SQL_DATABASE) {
  await execFileAsync(SQLCMD_PATH, [
    '-S',
    activeSqlServer,
    '-d',
    database,
    '-E',
    '-C',
    '-b',
    '-f',
    '65001',
    '-i',
    file,
  ], {
    encoding: 'buffer',
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function queryJson(query) {
  const text = await execSqlcmd(query);
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
  try {
    await execFileAsync(SQLCMD_PATH, [
      '-S',
      server,
      '-d',
      'master',
      '-E',
      '-C',
      '-b',
      '-h',
      '-1',
      '-W',
      '-u',
      '-Q',
      'SELECT 1 AS ok;',
    ], {
      encoding: 'buffer',
      maxBuffer: 1024 * 1024,
    });
    return true;
  } catch (_error) {
    return false;
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

  await execSqlcmd(`
    IF DB_ID(N'${SQL_DATABASE.replace(/'/g, "''")}') IS NULL
    BEGIN
      CREATE DATABASE [${SQL_DATABASE.replace(/]/g, ']]')}];
    END
  `, 'master');

  await runSqlFile(SCHEMA_FILE, SQL_DATABASE);
  await runSqlFile(SEED_FILE, SQL_DATABASE);
}

app.get('/api/lookups', async (_req, res) => {
  try {
    const [specialties, subjects, groups, teachers] = await Promise.all([
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
    ]);

    res.json({ specialties, subjects, groups, teachers });
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
    await execSqlcmd(buildInsertQuery(def, req.body || {}));
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
    await execSqlcmd(buildUpdateQuery(def, req.params.id, req.body || {}));
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
    await execSqlcmd(buildDeleteQuery(def, req.params.id));
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
    app.listen(PORT, () => {
      console.log(`MSU tables app running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start application:');
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
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
