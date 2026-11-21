-- =============================================================
-- Columna para la URL de la portada (Cloudinary).
-- Solo la crea si todavía no existe, así se puede ejecutar varias veces.
-- =============================================================
USE Biblioteca;
GO

IF COL_LENGTH('dbo.Libros', 'portada_url') IS NULL
  ALTER TABLE Libros ADD portada_url NVARCHAR(500) NULL;
GO
