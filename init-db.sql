-- Tạo cơ sở dữ liệu cho Users Microservice
CREATE DATABASE IF NOT EXISTS users_db;

-- Tạo cơ sở dữ liệu cho Social Media Microservice
CREATE DATABASE IF NOT EXISTS social_media_db;

-- Tạo user và gán quyền cho cả hai cơ sở dữ liệu
CREATE USER IF NOT EXISTS 'testuser'@'%' IDENTIFIED BY 'testuser123';

GRANT ALL PRIVILEGES ON users_db.* TO 'testuser'@'%';
GRANT ALL PRIVILEGES ON social_media_db.* TO 'testuser'@'%';

FLUSH PRIVILEGES;
