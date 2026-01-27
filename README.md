# 💚 cuidaDos

**cuidaDos** es una aplicación web desarrollada como Trabajo de Fin de Grado (TFG) para el ciclo de Desarrollo de Aplicaciones Web. 
Su objetivo es facilitar la contratación de servicios de cuidado y ayuda a domicilio, conectando a usuarios que necesitan asistencia con empresas especializadas del sector.

## 🌍 Descripción general

El proyecto ofrece una solución integral para la gestión de servicios de cuidado, centralizando la oferta y demanda en una plataforma segura e intuitiva.

* **Frontend:** Angular (TypeScript) + TailwindCSS.
* **Backend & Base de Datos:** Supabase (PostgreSQL + Auth + Storage).
* **Funcionalidades:** Gestión de contratos, mensajería, calendarios interactivos (FullCalendar) y notificaciones.
* **Roles:** Administrador, Empresa y Usuario (Cliente).

## 🚀 Despliegue

La aplicación se encuentra desplegada en **Vercel**.

🔗 **Accede a la versión en producción:** [Inserta aquí tu enlace de Vercel]

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

⚙️ Instalación y ejecución local
Para ejecutar el proyecto en tu máquina local:Clonar el repositorio:
git clone [https://github.com/tu-usuario/cuidaDos.git](https://github.com/tu-usuario/cuidaDos.git)
cd cuidaDos

Instalar dependencias:
npm install
Configurar variables de entorno:
rea un archivo o configura tus environments con las credenciales de Supabase.

Ejecutar el servidor de desarrollo:
ng serve

La aplicación estará disponible en http://localhost:4200/.

🗄️ Base de datos (Supabase)
El sistema utiliza PostgreSQL gestionado a través de Supabase.
Las tablas principales incluyen:Usuarios / Empresas: Gestión de perfiles y roles.
Servicios: Catálogo de servicios ofrecidos por las empresas.Contratos: Relación entre usuarios y servicios contratados.
Horarios: Gestión de disponibilidad (Lunes a Domingo).Comunicaciones: Sistema de mensajería interna.

👤 Roles y Funcionalidades
Rol
Funcionalidades PrincipalesUsuarioRegistro, búsqueda de empresas, contratación de servicios, mensajería, calendario personal.EmpresaGestión de perfil, publicación de servicios/horarios, gestión de contratos, mensajería.AdminDashboard de métricas, gestión (CRUD) de usuarios y empresas, moderación de contenidos.🧠 Tecnologías utilizadasAngular: Framework principal para el desarrollo SPA.TypeScript: Lenguaje base para lógica robusta.Tailwind CSS: Diseño moderno y responsive.Supabase: Backend as a Service (Auth, DB, Storage).FullCalendar: Gestión visual de horarios y citas.SendGrid: (Opcional/Integrado) Para notificaciones por correo.

🧑‍🏫 Seguimiento y Tutorías
El desarrollo del proyecto ha seguido una planificación estructurada bajo la supervisión del tutor académico.
A continuación, se detallan los hitos alcanzados durante el proceso:
Presentación de Asignatura y Proyecto: Definición inicial y alcance.
Creación de Imagen Corporativa de la Empresa: Diseño de logos, paleta de colores y branding de "cuidaDos".
Elaboración de Contrato de Prestación de Servicios con la Empresa y Recogida de Necesidades del Proyecto: Formalización de requisitos.
Definición de Requisitos Funcionales y No Funcionales del Aplicativo y Presentación a la Empresa: Análisis detallado del sistema.
Desarrollo de las Interfaces Gráficas: Diseño y maquetación de las pantallas del aplicativo.
Desarrollo de la Estructura de la Base de Datos: Diseño del esquema en Supabase.
Definición de Modelo Relacional de la Base de Datos: Establecimiento de relaciones entre entidades (Usuarios, Contratos, Servicios).
Presentación a la Empresa de las Interfaces y la Base de Datos: Validación de prototipos y modelo de datos.
Elección de Tecnologías a Utilizar: Selección del stack MEAN/Angular + Supabase.Estructuración Inicial de Documentación: Planteamiento de la memoria técnica.
Definición de Puntos de los Manuales de Usuario y Técnico: Esquema de contenidos para la entrega final.
Desarrollo Inicial de Manuales de Usuario y Técnico: Redacción de la documentación.
Opciones de Despliegue de Aplicativos: Análisis de proveedores de hosting.Pruebas de Despliegue en Entorno Local: Configuración y tests iniciales.
Pruebas de Despliegue en Vercel: Puesta en producción definitiva.

👩‍💻 AutoríaEvelia Gil Paredes
CFGS en Desarrollo de Aplicaciones Web (DAW)
📍 IES Albarregas – Mérida (España)
📘 Proyecto TFG: cuidaDos (2025/2026)Distribuido bajo licencia MIT.
