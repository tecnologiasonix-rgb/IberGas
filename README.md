# IberGas — Plataforma web

Web pública + formulario de registro de técnicos + panel administrador,
sobre Firebase (Auth, Firestore, Storage), lista para desplegar en Vercel
desde GitHub.

## Estructura

```
index.html                  Home
public/
  registro-tecnico.html     Formulario de alta de técnicos colaboradores
  contacto.html
  colaboradores.html
  faq.html
  privacidad.html
  aviso-legal.html
admin/
  index.html                Panel administrador (login + gestión de técnicos)
css/                        base.css (sistema de diseño) + hojas por página
js/
  firebase/config.js        Configuración Firebase (rellenar claves aquí)
  registro-tecnico.js       Lógica del formulario + subida de documentos
  admin.js                  Lógica del panel administrador
  partials.js                Header/footer inyectados en páginas de /public/
  site.js                   Menú móvil, scroll reveal, etc.
firestore.rules             Reglas de seguridad de Firestore
storage.rules                Reglas de seguridad de Storage
```

## 1. Configurar Firebase

1. Crea un proyecto en https://console.firebase.google.com
2. Activa **Authentication** → método "Correo electrónico/contraseña".
3. Activa **Firestore Database** (modo producción).
4. Activa **Storage**.
5. En "Configuración del proyecto → General → Tus apps", crea una app web
   y copia el objeto `firebaseConfig`.
6. Pega esos valores en `js/firebase/config.js`, sustituyendo los
   placeholders `REEMPLAZAR_...`.

### Crear el primer administrador

El panel admin solo deja entrar a usuarios cuyo email está registrado en
la colección `admins` de Firestore (esto lo exigen las reglas de
seguridad, no solo el frontend).

1. En **Authentication**, crea manualmente un usuario (tu email + contraseña).
2. En **Firestore**, crea la colección `admins` con un documento cuyo
   **ID sea exactamente ese email** (por ejemplo `admin@ibergas.es`),
   con cualquier contenido, por ejemplo `{ "nombre": "Admin IberGas" }`.
3. Ya puedes entrar en `/admin/index.html` con ese email y contraseña.

Repite el paso 2 (con otro documento) por cada persona que necesite
acceso al panel.

### Publicar las reglas de seguridad

Con la [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm install -g firebase-tools
firebase login
firebase init   # selecciona Firestore y Storage, usa los .rules ya existentes
firebase deploy --only firestore:rules,storage:rules
```

O pega el contenido de `firestore.rules` y `storage.rules` directamente
en la consola de Firebase (Firestore → Reglas / Storage → Reglas).

**Importante:** sin estas reglas publicadas, cualquiera podría leer los
datos y documentos de los técnicos registrados. El frontend por sí solo
no basta para proteger esa información.

## 2. Subir a GitHub

```bash
cd ibergas
git init
git add .
git commit -m "Plataforma IberGas: web, registro de técnicos y panel admin"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

## 3. Desplegar en Vercel

1. En https://vercel.com, "Add New Project" → importa el repositorio de GitHub.
2. Es un sitio estático: no hace falta framework preset ni build command.
   Deja "Output Directory" en la raíz (`.`).
3. Deploy.

Cada push a `main` volverá a desplegar automáticamente.

## Notas sobre el modelo de datos (colección `tecnicos`)

Cada documento de la colección `tecnicos` en Firestore contiene:

- Datos personales, profesionales, habilitaciones, zona, medios y tipo
  de colaboración (ver `js/registro-tecnico.js` para el listado exacto
  de campos).
- `estado`: `pendiente_revision` | `validado` | `disponible` | `no_disponible`
- `notasInternas`: texto libre, solo editable desde el panel admin.
- `documentos`: array de `{ categoria, nombre, url, path }` con los
  archivos subidos a Storage bajo `/tecnicos/{id}/...`.
- `fechaRegistro`: timestamp del servidor.

## Próximos pasos sugeridos (arquitectura ya preparada para esto)

- Formulario de contacto → colección `mensajes_contacto` (las reglas ya
  están escritas, falta conectar `contacto.html` a Firestore igual que
  se hizo con el registro de técnicos).
- Portal para empresas que soliciten técnicos.
- Sistema de asignación de trabajos y notificaciones a técnicos.
- Área privada de técnicos (login propio, ver sus trabajos asignados).
- Gestión de servicios realizados / historial.
