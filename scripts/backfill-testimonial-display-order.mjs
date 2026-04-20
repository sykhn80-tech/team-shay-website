import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined.");
}

const connection = await mysql.createConnection(databaseUrl);

try {
  await connection.execute(
    `UPDATE testimonials
     SET displayOrder = CASE
       WHEN sortOrder IS NULL THEN displayOrder
       ELSE sortOrder
     END`
  );

  const [rows] = await connection.execute(
    `SELECT id, sourceName, sortOrder, displayOrder
     FROM testimonials
     ORDER BY displayOrder ASC, id ASC`
  );

  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
