# 🔧 Taller El Pistón - Sistema de Gestión

Sistema web completo para la gestión de un taller mecánico, desarrollado como proyecto para la asignatura. Permite registrar clientes, vehículos, órdenes de servicio, controlar el inventario de repuestos, llevar el control de pagos y generar reportes estadísticos.

## 🚀 Tecnologías Utilizadas

*   **Backend (Base de Datos y API):** [PocketBase](https://pocketbase.io/) (Un backend open-source en un solo archivo ejecutable, basado en SQLite).
*   **Frontend (Interfaz de Usuario):** HTML5, CSS3 y JavaScript (Vanilla).
*   **Librerías:** SDK de PocketBase para JavaScript (incluido vía CDN).

## 📂 Estructura del Proyecto

```text
Taller_Piston/
│
├── cliente/                  # Frontend (Interfaz web)
│   ├── index.html            # Estructura de la página y modales
│   ├── styles.css            # Estilos, diseño responsive y modo oscuro
│   └── app.js                # Lógica de la app, conexión con PocketBase
│
├── servidor/                 # Backend (PocketBase)
│   ├── pb_migrations/        # Script para crear las tablas automáticamente
│   │   └── 1770000001_taller_db.js
│   ├── pb_hooks/             # Reglas de negocio (Ej: descuento de stock)
│   │   └── main.pb.js
│   └── pocketbase.exe        # Ejecutable del servidor (No se sube al repo)
│
└── .gitignore                # Archivos excluidos del repositorio