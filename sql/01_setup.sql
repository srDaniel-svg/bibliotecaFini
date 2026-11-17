-- =============================================================
-- 0) Crear Login para Node.js (Autenticación SQL Server)
-- =============================================================
USE master;
GO
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'biblio')
BEGIN
    CREATE LOGIN biblio WITH PASSWORD = 'Biblio123*', CHECK_POLICY = OFF;
    ALTER SERVER ROLE sysadmin ADD MEMBER biblio;
END
GO

-- =============================================================
-- 1) Crear Base de Datos Biblioteca
-- =============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Biblioteca')
BEGIN
    CREATE DATABASE Biblioteca;
END
GO

USE Biblioteca;
GO

-- Asignar permisos al usuario biblio en la base de datos
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'biblio')
BEGIN
    CREATE USER biblio FOR LOGIN biblio;
    ALTER ROLE db_owner ADD MEMBER biblio;
END
GO

-- =============================================================
-- 2) Crear Tablas del Sistema
-- =============================================================
IF OBJECT_ID('Detalle_Prestamo', 'U') IS NOT NULL DROP TABLE Detalle_Prestamo;
IF OBJECT_ID('Prestamos', 'U') IS NOT NULL DROP TABLE Prestamos;
IF OBJECT_ID('Libros', 'U') IS NOT NULL DROP TABLE Libros;
IF OBJECT_ID('Usuarios', 'U') IS NOT NULL DROP TABLE Usuarios;
GO

CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20)
);

CREATE TABLE Libros (
    id_libro INT IDENTITY(1,1) PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    autor VARCHAR(100),
    stock INT NOT NULL DEFAULT 0
);

CREATE TABLE Prestamos (
    id_prestamo INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_salida DATE NOT NULL,
    fecha_devolucion DATE NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Detalle_Prestamo (
    id_prestamo INT NOT NULL,
    id_libro INT NOT NULL,
    estado_libro VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_prestamo, id_libro),
    FOREIGN KEY (id_prestamo) REFERENCES Prestamos(id_prestamo),
    FOREIGN KEY (id_libro) REFERENCES Libros(id_libro)
);
GO

-- =============================================================
-- 3) Datos de Prueba Iniciales
-- =============================================================
INSERT INTO Usuarios (nombre, telefono) VALUES
 ('Ana Rojas','70011223'),
 ('Luis Mamani','70455667'),
 ('Carla Vaca','76123456'),
 ('Pedro Suárez','69988776');

INSERT INTO Libros (titulo, autor, stock) VALUES
 ('Cien años de soledad','Gabriel García Márquez',3),
 ('Don Quijote de la Mancha','Miguel de Cervantes',2),
 ('El principito','Antoine de Saint-Exupéry',4),
 ('Rayuela','Julio Cortázar',1),
 ('La ciudad y los perros','Mario Vargas Llosa',0); -- Stock 0 a propósito para demostración de ROLLBACK

INSERT INTO Prestamos (id_usuario, fecha_salida, fecha_devolucion) VALUES
 (1,'2026-11-01','2026-11-05'),
 (2,'2026-11-03',NULL),
 (1,'2026-11-07',NULL);

INSERT INTO Detalle_Prestamo VALUES
 (1,1,'Devuelto'),
 (1,3,'Devuelto'),
 (2,2,'Prestado'),
 (3,3,'Prestado');
GO
