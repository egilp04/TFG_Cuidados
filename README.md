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
```

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

🧑‍🏫 Seguimiento y Tutorías
El desarrollo del proyecto ha seguido una planificación estructurada bajo la supervisión del tutor académico.
A continuación, se detallan los hitos alcanzados durante el proceso:

|Fecha | Hito / Actividad | Descripción |
| :--- | :--- |
| 16.09.25| **Presentación de Asignatura y Proyecto** | Definición inicial y alcance del proyecto. |
| **Creación de Imagen Corporativa** | Diseño de logos, paleta de colores y branding de "cuidaDos".  ![Logo de cuidaDos](assets/logo.png)|
| **Elaboración de Contrato** | Formalización de requisitos y recogida de necesidades con la empresa. |
| **Definición de Requisitos** | Análisis detallado del sistema (funcionales y no funcionales) y presentación. |
| **Desarrollo de Interfaces Gráficas** | Diseño y maquetación de las pantallas del aplicativo. |
| **Desarrollo Estructura BDD** | Diseño del esquema de la base de datos en Supabase. |
| **Definición Modelo Relacional** | Establecimiento de relaciones entre entidades (Usuarios, Contratos, Servicios). |
| **Presentación a la Empresa** | Validación de prototipos de interfaces y modelo de datos. |
| **Elección de Tecnologías** | Selección del stack MEAN/Angular + Supabase. |
| **Estructuración Documentación** | Planteamiento inicial de la memoria técnica. |
| **Esquema de Manuales** | Definición de puntos para los manuales de Usuario y Técnico. |
| **Desarrollo de Manuales** | Redacción inicial de la documentación de usuario y técnica. |
| **Opciones de Despliegue** | Análisis de proveedores de hosting para el aplicativo. |
| **Pruebas en Entorno Local** | Configuración del servidor y tests iniciales. |
| **Pruebas de Despliegue en Vercel** | Puesta en producción definitiva. |

👩‍💻 AutoríaEvelia Gil Paredes
CFGS en Desarrollo de Aplicaciones Web (DAW)
📍 IES Albarregas – Mérida (España)
📘 Proyecto TFG: cuidaDos (2025/2026)

Distribuido bajo licencia MIT.
