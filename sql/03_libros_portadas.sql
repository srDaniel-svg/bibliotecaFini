-- =============================================================
-- Libros con portada ilustrada (imágenes en frontend/public/portadas)
-- Solo inserta los que todavía no existen, así se puede ejecutar varias veces.
-- =============================================================
USE Biblioteca;
GO

INSERT INTO Libros (titulo, autor, stock)
SELECT v.titulo, v.autor, v.stock
FROM (VALUES
 ('Si el dinero no te alcanza... ¡Cámbiate de país!', 'Dr. Gastón Sinforoso', 2),
 ('Si la vida te da golpes... ¡Devuélvele un cabezazo!', 'Dra. Paz Armada', 3),
 ('Si te da miedo el futuro... ¡Cómprate un perro y que él vaya a trabajar!', 'Dr. Lázaro Del Descanso', 4),
 ('Si la gente opina de tu vida... ¡Hazles ruido de motor con la boca!', 'Dra. Zoila Queja', 2),
 ('Si te da sueño manejando... ¡Ponte a hacer preguntas existenciales!', 'Dr. Desvelado Vigil', 1),
 ('Si tienes sed pero no te quieres levantar de la cama... ¡Avienta una pantufla al vaso de agua!', 'Dr. Lázaro De La Cama', 3),
 ('Si te da miedo la oscuridad... ¡Márcale un límite y amenízala con tu pantufla!', 'Dr. Justo Temores', 2),
 ('De los 3 Pokémon iniciales... ¡Todo el mundo sabe que Bulbasaur era m*erda!', 'Friedrich Nietzsche', 5),
 ('Frases que hacen pensar: Pensamientos inmortales', 'Friedrich Nietzsche', 1),
 ('No estudies tanto, recuerda que en la vida también se aprueba con carisma', 'Benedetto Gatti', 3)
) AS v(titulo, autor, stock)
WHERE NOT EXISTS (SELECT 1 FROM Libros l WHERE l.titulo = v.titulo);
GO
