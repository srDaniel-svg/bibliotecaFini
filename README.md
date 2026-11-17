# Biblioteca – Préstamos (React + Node.js + SQL Server)

## 1. Base de datos
Abre `sql/01_setup.sql` en SSMS y ejecútalo completo (crea BD, tablas y datos de prueba).

## 2. Backend
    cd backend
    # edita .env (usuario y contraseña de SQL Server)
    npm install
    npm start          # http://localhost:3001

## 3. Frontend
    cd frontend
    npm install
    npm run dev        # http://localhost:5173

> SQL Server debe tener habilitado TCP/IP (puerto 1433) y autenticación mixta (usuario sa).
