# 📚 Sistema de Biblioteca Facultativa – UAGRM FINI

Sistema web de gestión de préstamos, circulación y kardex bibliotecario con arquitectura transaccional atómica (React + Node.js Express + SQL Server).

Desarrollado para la **Facultad Integral del Ichilo (FINI)** – Universidad Autónoma Gabriel René Moreno (Sede Central Yapacaní, Santa Cruz - Bolivia).

---

## 🚀 Requisitos Previos

- **Node.js** (v18+)
- **SQL Server** (2019 o superior / Express) con:
  - Protocolo **TCP/IP** habilitado en puerto `1433`.
  - Modo de autenticación mixta (**SQL Server and Windows Authentication mode**).

---

## 🛠️ Puesta en Marcha

### 1. Base de Datos (SQL Server)
Abre y ejecuta completo el archivo:
👉 `sql/01_setup.sql` en **SQL Server Management Studio (SSMS)**.
- Crea automáticamente la base de datos `Biblioteca`.
- Crea el login `biblio` con contraseña `Biblio123*`.
- Crea las 4 tablas relacionales (`Usuarios`, `Libros`, `Prestamos`, `Detalle_Prestamo`) y carga los datos de prueba.

### 2. Backend (API REST)
```bash
cd backend
npm install
npm start
```
> La API quedará corriendo en `http://localhost:3001` con conexión directa a SQL Server.

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
> Abre tu navegador en `http://localhost:5173` para acceder a la aplicación.

---

## 📋 Módulos y Funcionalidades
- **Préstamos y Circulación**: Control de préstamos en curso, devolución con actualización de stock y transferencia de préstamos entre lectores.
- **Nuevo Préstamo (Transaccional)**: Registro atómico multilibro con control de concurrencia y `ROLLBACK` automático ante quiebre de stock.
- **Catálogo de Libros**: Registro de libros y control de existencias en tiempo real.
- **Directorio de Lectores**: Padrón de estudiantes y docentes habilitados.
- **Reportes SQL**: Consultas con `INNER JOIN`, `LEFT JOIN`, `GROUP BY` y filtros de stock crítico.
