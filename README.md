# 💚 cuidaDos

**cuidaDos** es una aplicación web desarrollada como Trabajo de Fin de Grado (TFG) para el ciclo de Desarrollo de Aplicaciones Web. 
Su objetivo es facilitar la contratación de servicios de cuidado y ayuda a domicilio, conectando a usuarios que necesitan asistencia con empresas especializadas del sector.

![Angular](https://img.shields.io/badge/Frontend-Angular%2019-344F51?style=for-the-badge&logo=angular&logoColor=EEEAE9)
![Supabase](https://img.shields.io/badge/Backend-Supabase-51786E?style=for-the-badge&logo=supabase&logoColor=EEEAE9)
![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-344F51?style=for-the-badge&logo=tailwindcss&logoColor=EEEAE9)
![License](https://img.shields.io/badge/License-MIT-51786E?style=for-the-badge&logo=opensourceinitiative&logoColor=EEEAE9)

## 🌍 Descripción general

El proyecto ofrece una solución integral para la gestión de servicios de cuidado, centralizando la oferta y demanda en una plataforma segura e intuitiva.

* **Frontend:** Angular (TypeScript) + TailwindCSS.
* **Backend & Base de Datos:** Supabase (PostgreSQL + Auth + Storage).
* **Funcionalidades:** Gestión de contratos, mensajería, calendarios interactivos (FullCalendar) y notificaciones.
* **Roles:** Administrador, Empresa y Usuario (Cliente).

## 🚀 Despliegue

La aplicación se encuentra desplegada en **Vercel**.

🔗 **Accede a la versión en producción:**
[![Desplegado en Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tfg-cuidados.vercel.app/)
> Sitio web intermodular para la contratación y gestión de servicios de cuidados especializados.

![Landing page de cuidaDos](./carpeta_imgs/landing.png)


## 🧱 Estructura del proyecto

```text
cuidaDos/
│
├── public/              # Recursos estáticos (imágenes, iconos...)
├── src/
│   ├── app/
│   │   ├── components/  # Componentes reutilizables (Navbar, Cards, Modals...)
│   │   ├── pages/       # Vistas principales (Home, Search, Dashboard...)
│   │   ├── services/    # Lógica de conexión con Supabase (Auth, Data...)
│   │   ├── models/      # Interfaces y tipos de TypeScript
│   │   ├── guards/      # Protección de rutas por roles
│   │   └── app.routes.ts # Definición de rutas
│   ├── assets/          # Estilos globales e imágenes
│   └── index.html       # Entrada principal
│
├── tailwind.config.js   # Configuración de estilos
├── angular.json         # Configuración del CLI de Angular
├── package.json         # Dependencias
└── README.md            # Documentación del proyecto
```

⚙️ Instalación y ejecución local
Para ejecutar el proyecto en tu máquina local:Clonar el repositorio:
git clone [https://github.com/tu-usuario/cuidaDos.git](https://github.com/tu-usuario/cuidaDos.git)

cd cuidaDos

Instalar dependencias:
npm install


Ejecutar el servidor de desarrollo:
ng serve (--watch)

La aplicación estará disponible en http://localhost:4200/.

🧪 Testing y Calidad de Software
La plataforma cuidaDos ha sido sometida a un ciclo de pruebas automatizadas para garantizar la integridad de los flujos de trabajo críticos (registro, contratación y gestión de perfiles).

1. Pruebas Unitarias (Karma & Jasmine)
Se han desarrollado pruebas unitarias para validar la lógica de los servicios y componentes de forma aislada.

Herramientas: Karma como test runner y Jasmine como framework de pruebas.

Ejecución:

ng test

Este comando abrirá una instancia del navegador Chrome para ejecutar la suite de pruebas y reportar los resultados en tiempo real.

2. Pruebas End-to-End (E2E)

Las pruebas E2E simulan el comportamiento real del usuario desde el inicio de sesión hasta la contratación de un servicio, verificando la integración total entre el Frontend (Angular) y el Backend (Supabase).

Ejecución:

ng e2e

📩 Pruebas de API y Contratos de Datos (Postman)

Antes de la integración en Angular, se validaron todos los endpoints y la lógica de la base de datos mediante Postman. Esto garantizó que las respuestas JSON coincidieran con las interfaces de TypeScript definidas en el proyecto.


🗄️ Base de datos (Supabase)
El sistema utiliza PostgreSQL gestionado a través de Supabase.
Las tablas principales incluyen:

Usuarios / Clientes, Administrador y Empresas: Gestión de perfiles y roles.
Servicios: Catálogo de servicios ofrecidos por las empresas.
Contratos: Relación entre usuarios y servicios contratados.
Horarios: Gestión de disponibilidad (Lunes a Domingo).
Comunicaciones: Sistema de mensajería interna.

👤 Roles y Funcionalidades

| Rol | Funcionalidades Principales |
| :--- | :--- |
| **Usuario** | Registro, inicio de sesión, búsqueda de empresas, contratación de servicios, mensajería, notificaciones, calendario personal, cancelación/visualización de contratos, gestión de perfil. |
| **Empresa** | Registro, inicio de sesión, gestión de perfil, publicación/eliminación de servicios/horarios, gestión de contratos, mensajería, notifiaciones. |
| **Admin** | Dashboard de métricas, gestión (CRUD) de usuarios y empresas, mensajes, notificaciones, gestión (CRUD) de servicios y horarios. |


## 🎨 Identidad Visual

| Elemento | Color Hex | Uso Principal |
| :--- | :--- | :--- |
| **Fondo** | `#EEEAE9` | Superficies y fondos de página |
| **Primario** | `#344F51` | Navegación, títulos y botones principales |
| **Secundario** | `#51786E` | Estados secundarios y elementos de apoyo |
| **Acento** | `#93D14B` | CTAs, éxitos, iconos destacados y bordes activos |
| **Error** | `#EF4444` | Mensajes de error, alertas críticas y validaciones fallidas |
| **Texto Principal** | `#1F2937` | Colores de textos y títulos principales |


## 🛠️ Tecnologías Principales

| Tecnología | Uso |
| :--- | :--- |
| **Angular 19** | Desarrollo del frontend con arquitectura reactiva de **Signals**. |
| **Supabase** | Gestión de autenticación, base de datos PostgreSQL y políticas RLS. |
| **Tailwind CSS** | Estilos utilitarios para un diseño fluido y responsive. |
| **Jasmine/Karma** | Suite de pruebas unitarias para garantizar la estabilidad del sistema. |


## 🧩 Características Implementadas

| Área | Descripción |
|-----|-------------|
| ⚙️ **Arquitectura Reactiva** | Uso de Angular v21 con Signals para una gestión de estado eficiente y una detección de cambios optimizada. |
| 🔐 **Sistema de Autenticación Pro** | Implementación de un flujo completo de Login, Registro dinámico (Cliente / Empresa) y Recuperación de contraseña gestionado mediante Supabase Auth. |
| 🛡️ **Seguridad Multicanal** | Protección de datos mediante Guards de Angular en el frontend y políticas RLS (Row Level Security) en la base de datos de Supabase. |
| 👥 **Gestión de Roles** | Sistema diferenciado de permisos para Usuarios (Clientes), Empresas de servicios y Administradores globales. |
| 🔎 **Buscador de Servicios Inteligente** | Interfaz de búsqueda con filtrado en tiempo real por nombre del servicio y categoría de cuidados. |
| 📋 **Ciclo de Contratación** | Flujo completo que abarca desde la selección de servicios y horarios hasta la formalización de contratos entre las partes. |
| 💬 **Comunicación Interna** | Sistema de mensajería privada entre clientes y proveedores, con control de estado de mensajes leídos y no leídos. |
| 🌍 **Internacionalización (i18n)** | Traducción completa de la interfaz mediante `ngx-translate`, permitiendo el cambio de idioma de forma dinámica. |
| ✅ **Validaciones Robustas** | Uso de Reactive Forms para la implementación de validaciones avanzadas de horarios, detección de duplicados y consistencia de datos. |


## 🏗️ Arquitectura Técnica

| Área | Detalles |
|------|----------|
| 🧠 **Core y Estado** | - Angular v21.0.7 con Signals para detección de cambios ultra eficiente y reactiva. <br> - Componentes Standalone: arquitectura modular sin NgModule, facilitando lazy loading. <br> - RxJS: gestión de flujos de datos complejos y sincronización en tiempo real con la base de datos. |
| 🔐 **Seguridad y Control de Acceso** | - Guards de Angular (authGuard, adminGuard) para proteger rutas según rol (Cliente, Empresa, Administrador). <br> - Supabase RLS: seguridad a nivel de base de datos, acceso solo a registros propios. <br> - Sistema de autenticación completo (Registro, Login, Recuperación) mediante Supabase Auth. |
| 🌍 **Internacionalización (i18n)** | - ngx-translate: traducción dinámica de la interfaz sin recargar la aplicación. <br> - Diccionarios JSON centralizados para escalabilidad y nuevos idiomas. |
| 🧩 **Biblioteca de Componentes (UI/UX)** | - Arquitectura modular y reutilizable siguiendo Atomic Design. <br> - Consistencia visual y mantenimiento simplificado con paleta de colores corporativa. |
| ⚛️ **Componentes Atómicos y Base** | - **Inputs dinámicos (app-inputs)**: integrados con Reactive Forms, validaciones en tiempo real, etiquetas flotantes animadas. <br> - **Botones personalizados (app-button)**: variantes primario, secundario, acento y error, según función. <br> - **Dropdown / Selects**: estilizados para filtrado de servicios y cambio de idioma. <br> - **Tarjetas dinámicas**: visualización de servicios, información de empresas y miembros del equipo de manera atractiva. |
| 📝 **Formularios de Registro y Perfil** | - **Registro de Usuarios y Empresas**: formularios reactivos con validaciones avanzadas (correo válido, contraseñas seguras, campos obligatorios). <br> - **Modificación de Perfil**: edición de datos personales y preferencias con sincronización en tiempo real con Supabase. <br> - **Feedback y validaciones dinámicas**: errores mostrados al instante, confirmaciones de cambios, y consistencia de datos garantizada. |
| 🏗️ **Layout y Navegación** | - **Navbar adaptativa**: menú dinámico según rol y soporte de i18n. <br> - **Footer institucional**: accesos rápidos y branding. <br> - **ButtonBack**: navegación intuitiva hacia atrás manteniendo el estado de la app. |
| 🗂️ **Módulos de Datos y CRUD** | - **Tabla CRUD Admin**: gestión de Usuarios y Empresas con filtrado, ordenación y paginación reactiva. <br> - **Tablas de Actividad y Contratos**: visualización de datos complejos con celdas personalizadas y Pipes de Angular. <br> - **Modales adaptables (MatDialog)**: confirmación de borrados, vistas detalladas de contratos y mensajería rápida. |
| 🌐 **Servicios y Navegación** | - **Servicios de datos**: AuthService, ContractService, MessageService, ComunicationService para gestión de sesión, contratos y mensajería. <br> - **Estrategia de navegación**: Angular Router (SPA), Lazy Loading para optimizar rendimiento y Deep Linking para rutas y filtros compartibles. |

## 🖼️ Mapa de Navegación y Vistas

El aplicativo utiliza un **sistema de enrutamiento dinámico protegido por Guards**, ofreciendo una experiencia personalizada según el estado de la sesión y el rol asignado.

---

### 🌐 Módulo Público y Corporativo

| Vista / Sección | Funcionalidad |
|-----------------|---------------|
| **Landing Page** | Presentación de la plataforma y propuesta de valor. |
| **About Us** | Información sobre la misión, visión y el equipo del proyecto. |
| **Legal & Ayuda** | Términos y Condiciones de uso y manuales (Política de Empresa y Guía de Usuario interactiva). |
| **Contacto** | Formulario de soporte directo integrado con EmailJS. |

---

### 🔐 Gestión de Acceso (Auth Flow)

| Función | Detalles |
|---------|---------|
| **Autenticación** | Sistema de acceso rápido mediante Modal de Login. |
| **Registro** | Página dedicada con selección de perfil (Cliente / Empresa). |
| **Seguridad** | Flujo de recuperación de contraseña vía email y reenvío de códigos de verificación para activación de cuentas. |

---

### 🏠 Paneles de Usuario

| Rol | Vista / Función | Descripción |
|-----|-----------------|-------------|
| Cliente / Empresa / Admin | **Home** | Dashboard principal con métricas clave y resumen de actividad reciente. |
| Cliente / Empresa / Admin | **Centro de Mensajes** | Sistema de chat interno para comunicación directa. |
| Cliente / Empresa / Admin | **Modificar Perfil** | Gestión completa de datos personales, credenciales y proceso de baja. |
| Cliente / Empresa / Admin | **Notificaciones** | Panel independiente para avisos automáticos del sistema. |
| Cliente | **Buscador de Empresas** | Galería con Tarjetas Detalladas, filtros avanzados y botones de contratación directa. |
| Cliente / Empresa | **Activities (Contratos Activos)** | Vista de contratos en curso con desglose de día, hora y detalles. |
| Cliente / Empresa | **Contracts** | Panel de gestión de contratos actuales: visualización de detalles y opción de eliminación/cancelación. |
| Empresa | **Servicio-Horario (Empresa)** | Gestión de la disponibilidad y fijación de precios y horarios por servicio. |

---

### ⚙️ Administración Global (Panel de Control)

| Vista / Función | Descripción |
|-----------------|------------|
| **Admin Dashboard** | Vista analítica con el estado general de la plataforma. |
| **Management de Usuarios** | CRUD avanzado para la administración de Clientes y Empresas. |
| **Servicios Globales** | Control del catálogo maestro de tipos de servicios de cuidados. |
| **Horarios Globales** | Configuración centralizada de las franjas horarias del sistema. |


## 🖼️ Imágenes del Proyecto
### 🔹 Logo e Identidad Visual
![Logo pequeño de cuidaDos](./carpeta_imgs/logo.png)

![Logo de cuidaDos](./carpeta_imgs/logo2.png)

*Logo principal de la marca cuidaDos, usado en la cabecera y branding.*

## 💻 Comandos útiles

| Acción                     | Comando        | Descripción |
|----------------------------|----------------|-------------|
| Instalar dependencias      | `npm install`  | Instala todas las dependencias del proyecto definidas en el archivo `package.json`. |
| Ejecutar en desarrollo     | `ng serve`     | Inicia el servidor de desarrollo y permite visualizar la aplicación en el navegador. |
| Ejecutar tests             | `ng test`      | Ejecuta las pruebas unitarias utilizando los frameworks Jasmine y Karma. |
| Build de producción        | `ng build`     | Genera la versión optimizada del proyecto para su despliegue en producción. |


🧑‍🏫 Seguimiento y Tutorías
El desarrollo del proyecto ha seguido una planificación estructurada bajo la supervisión del tutor académico.
A continuación, se detallan los hitos alcanzados durante el proceso:

| Fecha     | Hito / Actividad                     | Descripción |
|-----------|--------------------------------------|-------------|
| 16.09.25  | **Presentación de Asignatura y Proyecto** | Introducción a la asignatura de Proyectos y explicación de los objetivos generales del TFG. Se define el alcance inicial del proyecto, el contexto empresarial y las expectativas de desarrollo. Se establecen las primeras pautas metodológicas y de evaluación. |
| 07.10.25  | **Elaboración de Contrato**           | Recogida formal de requisitos junto con la empresa colaboradora. Definición de responsabilidades, objetivos del sistema y limitaciones del proyecto. Aprobación del documento contractual como base del desarrollo. |
| 14.10.25  | **Definición de Requisitos**          | Análisis detallado de los requisitos funcionales y no funcionales del sistema. Identificación de actores, casos de uso y necesidades técnicas. Presentación del documento de requisitos para su validación. |
| 21.10.25  | **Revisión y Validación de Requisitos** | Revisión de los requisitos definidos del TFG para detectar errores o mejoras. Ajuste del alcance del proyecto según las observaciones recibidas. Validación final como punto de partida para el diseño. |
| 23.10.25  | **Creación de Imagen Corporativa**    | Diseño de la identidad visual del proyecto *cuidaDos*, incluyendo logotipo, colores corporativos y tipografías. Definición de criterios de diseño para la interfaz. Integración de la imagen corporativa en la documentación. |
| 04.11.25  | **Desarrollo de Interfaces Gráficas** | Diseño y maquetación de las pantallas principales del aplicativo. Creación de prototipos navegables centrados en la experiencia de usuario. Aplicación de la imagen corporativa definida previamente. |
| 11.11.25  | **Iteración y Mejora de Interfaces**  | Revisión de las interfaces diseñadas para mejorar usabilidad y accesibilidad. Ajustes en la navegación y distribución de elementos. Preparación de prototipos finales para validación. |
| 18.11.25  | **Validación de Interfaces**          | Presentación de las interfaces a la empresa para su evaluación. Recogida de feedback y propuestas de mejora. Aprobación del diseño visual antes de la fase de desarrollo técnico. |
| 25.11.25  | **Desarrollo Estructura BDD**         | Diseño del esquema inicial de la base de datos utilizando Supabase. Definición de tablas, campos y tipos de datos. Preparación de la base para soportar la lógica del sistema. |
| 02.12.25  | **Optimización del Diseño de BDD**    | Revisión del diseño de la base de datos para evitar redundancias. Ajuste de estructuras para mejorar el rendimiento y la escalabilidad. Preparación para el modelo relacional definitivo. |
| 09.12.25  | **Definición Modelo Relacional**      | Establecimiento de relaciones entre las distintas entidades del sistema. Definición de claves primarias y foráneas. Documentación del modelo relacional para su implementación. |
| 13.01.26  | **Presentación a la Empresa**         | Exposición de los prototipos de interfaces y del modelo de datos. Validación del trabajo realizado hasta el momento. Aprobación para continuar con la fase de implementación final. |
| 20.01.26  | **Ajustes Post-Presentación**         | Aplicación de las mejoras propuestas por la empresa tras la presentación. Corrección de errores detectados en diseño o estructura de datos. Consolidación del sistema antes del despliegue. |
| 27.01.26  | **Elección de Tecnologías**           | Selección del stack tecnológico definitivo para el desarrollo del aplicativo. Justificación de la elección de Angular y Supabase. Análisis de ventajas técnicas y de mantenimiento. |
| 03.02.26  | **Estructuración Documentación**      | Organización de la memoria técnica del TFG. Definición de capítulos, apartados y anexos. Preparación de la base documental para la redacción final. |
| 10.02.26  | **Esquema de Manuales**               | Definición de la estructura de los manuales de Usuario y Técnico. Identificación de contenidos clave y capturas necesarias. Planificación de la redacción detallada. |
| 24.02.26         | **Desarrollo de Manuales**            | Redacción del manual de usuario con instrucciones de uso del aplicativo. Elaboración del manual técnico con detalles de arquitectura y configuración. Inclusión de capturas y ejemplos prácticos. |
| 03.0.326        | **Opciones de Despliegue**            | Análisis de distintas alternativas de hosting para el aplicativo. Comparación de costes, rendimiento y facilidad de mantenimiento. Selección de la opción más adecuada. |
| 10.03.26         | **Pruebas en Entorno Local**          | Configuración del entorno de desarrollo local. Ejecución de pruebas funcionales y técnicas. Corrección de errores antes del despliegue en producción. |
| 17.0.3.26         | **Pruebas de Despliegue en Vercel**   | Despliegue del aplicativo en Vercel como entorno de producción. Verificación del correcto funcionamiento del sistema. Validación final del proyecto. |

Notas del seguimiento
Cada sesión siguió la estructura: resumen de avances, demo funcional, bloqueo/riesgos y tareas para la siguiente semana.


👩‍💻 Autoría

**Evelia Gil Paredes**

CFGS en Desarrollo de Aplicaciones Web (DAW)

📍 IES Albarregas – Mérida (España)

📘 Proyecto TFG: cuidaDos (2025/2026)

Distribuido bajo licencia MIT.
