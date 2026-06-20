# DPRIAN Fanfest 🎉

Página de fans para subir y ver fotos y videos del Fanfest, organizada por evento y fecha, con buscador.

## ¿Qué incluye?

- **Registro e inicio de sesión** (nombre, correo, contraseña) para poder subir contenido.
- **Subir fotos y videos** con descripción, nombre del evento y fecha.
- **Muro tipo "fotos pegadas"** para ver todo lo subido.
- **Buscador** por texto + **filtro por evento** + **filtro por rango de fechas**.
- Cada quien puede **borrar sus propias publicaciones**.

## Tecnología usada

| Parte | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Base de datos | MongoDB (Atlas, gratis) |
| Fotos y videos | Cloudinary (gratis hasta cierto límite) |
| Frontend | HTML + CSS + JavaScript (sin frameworks, todo en `/public`) |

> **¿Por qué Cloudinary y no guardar los archivos directo en el servidor?**
> Porque cuando subes tu app a un servicio como Render, cada vez que se reinicia o actualiza el servidor, los archivos guardados en disco **se borran**. Cloudinary los guarda de forma permanente y además optimiza/comprime automáticamente.

---

## Paso 1: Crear tu base de datos en MongoDB Atlas (gratis)

1. Ve a https://www.mongodb.com/cloud/atlas/register y crea una cuenta.
2. Crea un **cluster gratuito** (M0).
3. En "Database Access", crea un usuario con contraseña (guárdala).
4. En "Network Access", agrega `0.0.0.0/0` (permitir acceso desde cualquier lugar) para que Render se pueda conectar.
5. Haz clic en "Connect" → "Drivers" → copia la cadena de conexión. Se ve así:
   ```
   mongodb+srv://usuario:<password>@cluster0.xxxxx.mongodb.net/
   ```
6. Reemplaza `<password>` por tu contraseña real y agrega el nombre de la base al final, por ejemplo:
   ```
   mongodb+srv://usuario:tupassword@cluster0.xxxxx.mongodb.net/dprian-fanfest
   ```

## Paso 2: Crear tu cuenta de Cloudinary (gratis)

1. Ve a https://cloudinary.com/users/register/free y crea una cuenta.
2. En el Dashboard verás tres datos que necesitas:
   - `Cloud name`
   - `API Key`
   - `API Secret`

## Paso 3: Configurar el proyecto en tu computadora

1. Asegúrate de tener [Node.js](https://nodejs.org) instalado (versión 18 o más reciente).
2. Abre una terminal dentro de esta carpeta y corre:
   ```bash
   npm install
   ```
3. Copia el archivo `.env.example` y renómbralo a `.env`.
4. Llena el `.env` con tus datos:
   ```
   MONGODB_URI=tu_cadena_de_mongodb
   JWT_SECRET=cualquier_texto_largo_y_secreto_que_te_inventes
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   PORT=5000
   ```
5. Corre el proyecto:
   ```bash
   npm start
   ```
6. Abre tu navegador en `http://localhost:5000` — ¡ya deberías ver la página!

## Paso 4: Subir la página a internet (con Render, gratis)

1. Sube esta carpeta a un repositorio de GitHub (puedes arrastrar los archivos directo en github.com si no usas Git).
2. Ve a https://render.com y crea una cuenta (puedes entrar con tu GitHub).
3. Clic en **"New +" → "Web Service"** y conecta tu repositorio.
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. En la sección **"Environment"**, agrega las mismas variables que pusiste en tu `.env` (MONGODB_URI, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). No necesitas poner PORT, Render lo asigna solo.
6. Dale "Deploy". En unos minutos tendrás una URL pública como `https://dprian-fanfest.onrender.com` que puedes compartir con la fanbase.

> Nota: en el plan gratuito de Render, el servidor "se duerme" tras un rato sin uso y tarda unos segundos en despertar con la primera visita. Si quieres que esté siempre activo al instante, tendrías que pasar a un plan de pago.

---

## Estructura del proyecto

```
dprian-fanfest/
├── server.js              ← arranca el servidor
├── config/
│   ├── db.js               ← conexión a MongoDB
│   └── cloudinary.js       ← conexión a Cloudinary
├── models/
│   ├── User.js              ← esquema de usuarios
│   └── Post.js              ← esquema de publicaciones (fotos/videos)
├── middleware/
│   └── auth.js              ← protege rutas que requieren sesión
├── routes/
│   ├── auth.js               ← registro / login
│   └── posts.js              ← subir, listar, filtrar y borrar publicaciones
└── public/                   ← todo el frontend
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Personalizar

- **Colores y tipografía**: edita las variables al inicio de `public/css/style.css` (sección `:root`).
- **Nombre/marca**: edita el `<div class="brand">` en `public/index.html`.
- **Tamaño máximo de archivo**: en `routes/posts.js`, busca `fileSize: 150 * 1024 * 1024` (en bytes; ahí está en 150 MB).

## ¿Algo no funciona?

- Si al subir una foto te da error 401: tu sesión expiró, vuelve a iniciar sesión.
- Si el servidor no arranca: revisa que tu `.env` tenga todos los valores bien copiados, sin comillas ni espacios.
- Si las imágenes no cargan: revisa que tus credenciales de Cloudinary sean correctas.
