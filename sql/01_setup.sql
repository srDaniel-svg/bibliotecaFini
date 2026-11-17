-- 1) Ejecuta este script en SQL Server Management Studio (SSMS)
CREATE DATABASE Biblioteca;
GO
USE Biblioteca;
GO

CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100),
    telefono VARCHAR(20)
);

CREATE TABLE Libros (
    id_libro INT IDENTITY(1,1) PRIMARY KEY,
    titulo VARCHAR(150),
    autor VARCHAR(100),
    stock INT
);

CREATE TABLE Prestamos (
    id_prestamo INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    fecha_salida DATE,
    fecha_devolucion DATE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Detalle_Prestamo (
    id_prestamo INT,
    id_libro INT,
    estado_libro VARCHAR(20),
    PRIMARY KEY (id_prestamo, id_libro),
    FOREIGN KEY (id_prestamo) REFERENCES Prestamos(id_prestamo),
    FOREIGN KEY (id_libro) REFERENCES Libros(id_libro)
);
GO

-- Datos de prueba
INSERT INTO Usuarios (nombre, telefono) VALUES
 ('Ana Rojas','70011223'),('Luis Mamani','70455667'),('Carla Vaca','76123456'),('Pedro Suárez','69988776');

INSERT INTO Libros (titulo, autor, stock) VALUES
 ('Cien años de soledad','Gabriel García Márquez',3),
 ('Don Quijote de la Mancha','Miguel de Cervantes',2),
 ('El principito','Antoine de Saint-Exupéry',4),
 ('Rayuela','Julio Cortázar',1),
 ('La ciudad y los perros','Mario Vargas Llosa',0);  -- stock 0 a propósito: sirve para demostrar ROLLBACK

INSERT INTO Prestamos (id_usuario, fecha_salida, fecha_devolucion) VALUES
 (1,'2026-11-01','2026-11-05'),
 (2,'2026-11-03',NULL),
 (1,'2026-11-07',NULL);

INSERT INTO Detalle_Prestamo VALUES
 (1,1,'Devuelto'),(1,3,'Devuelto'),(2,2,'Prestado'),(3,3,'Prestado');
GO
