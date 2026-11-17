USE Biblioteca;
GO
-- ===== DEMO 1: COMMIT (todo sale bien) =====
BEGIN TRANSACTION;
    INSERT INTO Prestamos (id_usuario, fecha_salida) VALUES (3, CAST(GETDATE() AS DATE));
    DECLARE @id INT = SCOPE_IDENTITY();
    INSERT INTO Detalle_Prestamo VALUES (@id, 1, 'Prestado');
    UPDATE Libros SET stock = stock - 1 WHERE id_libro = 1;
COMMIT TRANSACTION;

-- ===== DEMO 2: ROLLBACK (algo falla, se deshace todo) =====
BEGIN TRANSACTION;
    INSERT INTO Prestamos (id_usuario, fecha_salida) VALUES (4, CAST(GETDATE() AS DATE));
    DECLARE @id2 INT = SCOPE_IDENTITY();
    INSERT INTO Detalle_Prestamo VALUES (@id2, 5, 'Prestado');
    UPDATE Libros SET stock = stock - 1 WHERE id_libro = 5;   -- queda en -1 (sin stock)
    IF (SELECT stock FROM Libros WHERE id_libro = 5) < 0
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT 'ROLLBACK: no había stock';
    END
    ELSE COMMIT TRANSACTION;

-- ===== DEMO 3: TRANSFERENCIA de un préstamo a otro usuario =====
BEGIN TRY
    BEGIN TRANSACTION;
        UPDATE Prestamos SET id_usuario = 3 WHERE id_prestamo = 2 AND fecha_devolucion IS NULL;
        IF @@ROWCOUNT = 0 THROW 50001, 'Préstamo no existe o ya fue devuelto', 1;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT ERROR_MESSAGE();
END CATCH;
