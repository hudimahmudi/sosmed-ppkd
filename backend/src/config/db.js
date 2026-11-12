// File ini: koneksi ke MySQL + membuat database dan 4 tabel otomatis
import 'dotenv/config'; // baca isi file .env
import mysql from 'mysql2/promise';

// Ambil pengaturan dari .env (kalau kosong pakai nilai bawaan)
const {
  DB_HOST = 'localhost',
  DB_PORT = 8111,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'connectspace_db',
} = process.env;

// 1) Koneksi sementara (tanpa nama database) hanya untuk membuat database
const boot = await mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
});
await boot.query(
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await boot.end(); // tutup koneksi sementara

// 2) Pool koneksi utama (dipakai oleh semua controller)
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z', // baca & tulis waktu dalam UTC
});

// Setiap koneksi baru dipaksa memakai zona waktu UTC
pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));

// 3) Buat 4 tabel (urutan penting karena ada foreign key)

// Tabel users
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NULL,
    bio TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
  ) ENGINE=InnoDB
`);

// Tabel posts (hapus user -> post ikut terhapus)
await pool.query(`
  CREATE TABLE IF NOT EXISTS posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NULL,
    image VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`);

// Tabel likes (UNIQUE user_id + post_id = 1 akun cuma bisa 1 like per post)
await pool.query(`
  CREATE TABLE IF NOT EXISTS likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    post_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_likes_user_post (user_id, post_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`);

// Tabel comments
await pool.query(`
  CREATE TABLE IF NOT EXISTS comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    image VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`);

console.log(`Database "${DB_NAME}" siap dipakai`);

export default pool; // diekspor supaya bisa dipakai file lain
