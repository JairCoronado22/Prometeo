# Prometeo (Cliente React Native)

**Prometeo** es una aplicación móvil cliente de recomendación musical desarrollada con **React Native** y **TypeScript**. Se conecta a un servicio REST en **Spring Boot (Java)** para identificar usuarios, consultar el catálogo y las recomendaciones similares, y registrar selecciones en el historial.

---

## 🚀 Arquitectura y Tecnologías

- **Framework Móvil**: React Native (v0.74.5)
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation (Native Stack)
- **Gestión de Estado**: React Context API (`AuthContext`)
- **Custom Hooks**: `useLocation` para geolocalización, `useAuth` para sesión
- **GPS nativo**: `@react-native-community/geolocation` y permisos de ubicación Android
- **Sensores**: acelerómetro para descubrir canciones similares al agitar el dispositivo
- **Respuesta háptica**: vibración al cargar recomendaciones
- **Persistencia Local**: `@react-native-async-storage/async-storage`
- **Geolocalización**: `PermissionsAndroid` + Geolocation / IP API
- **Cliente HTTP**: Fetch API nativa
- **Backend Integrado**: Spring Boot + PostgreSQL (`Apolo / prometeo`)

---

## 🛠️ Requisitos del Sistema

Para ejecutar el proyecto cliente y conectarlo con el servidor backend, se requiere:

- **Node.js**: v18.0.0 o superior
- **JDK (Java Development Kit)**: Java 17
- **Android Studio**: Con SDK de Android (API 33+) y un emulador (AVD) o dispositivo físico conectado por USB con depuración activada.
- **Servidor Backend**: Proyecto `Apolo` (Spring Boot) corriendo en `http://localhost:8080`.

---

## 📁 Estructura del Proyecto

```
prometeo/
├── App.tsx                     # Punto de entrada de la aplicación
├── app.json                    # Configuración y nombre oficial de la app
├── package.json                # Dependencias del proyecto
├── tsconfig.json               # Configuración de TypeScript
├── android/                    # Proyecto nativo de Android
└── src/
    ├── api/
    │   └── apoloApi.ts         # Cliente REST API (comunicación con Spring Boot)
    ├── components/
    │   ├── LocationBanner.tsx  # Ubicación detectada y sugerencias locales
    │   └── SongItem.tsx        # Tarjeta reutilizable para canciones
    ├── context/
    │   └── AuthContext.tsx     # Contexto global de sesión de usuario
    ├── hooks/
    │   ├── useLocation.ts      # Hook personalizado para geolocalización
    │   └── useShake.ts         # Detecta sacudidas con el acelerómetro
    ├── navigation/
    │   └── AppNavigator.tsx    # Configuración de rutas (Stack Navigator)
    ├── screens/
    │   ├── LoginScreen.tsx     # Identificación y registro automático
    │   ├── MainScreen.tsx      # Exploración, catálogo y recomendaciones ML
    │   └── HistoryScreen.tsx   # Historial local persistente
    ├── services/
    │   ├── historyStorage.ts   # Persistencia local con AsyncStorage
    │   └── locationService.ts  # Geolocalización nativa GPS / IP
    └── types/
        └── index.ts            # Interfaces y tipos de TypeScript
```

---

## 📖 Guía de Ejecución Paso a Paso

### 1️⃣ Iniciar el Servidor Backend (Spring Boot)

En la carpeta del backend `Apolo/prometeo`:

```bash
# En Windows (PowerShell)
.\gradlew.bat bootRun

# En Linux / macOS
./gradlew bootRun
```
> El servidor quedará escuchando en `http://localhost:8080`.

---

### 2️⃣ Iniciar el Cliente React Native (`Prometeo`)

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar Metro Bundler**:
   ```bash
   npx react-native start
   ```

3. **Ejecutar en Emulador de Android**:
   ```bash
   npx react-native run-android
   ```

---

### 📱 Ejecución en Dispositivo Físico (Celular por USB)

Si ejecutas la app en un teléfono físico conectado por cable USB:

1. Activa la **Depuración por USB** en las opciones de desarrollador de tu celular.
2. Redirige los puertos de la PC al teléfono mediante ADB:
   ```bash
   adb reverse tcp:8080 tcp:8080
   adb reverse tcp:8081 tcp:8081
   ```
3. Ejecuta la app en el dispositivo:
   ```bash
   npx react-native run-android
   ```

---

## 🌐 Endpoints REST Consumidos

En la pantalla de exploración, selecciona una canción y agita el dispositivo para volver a
consultar recomendaciones similares. La app reutiliza `GET /api/songs/similar` sin cambios
en el backend. El acelerómetro no requiere permiso de ejecución; Android declara el permiso
`VIBRATE` para la respuesta háptica. La escucha del sensor se detiene al salir de la pantalla
o abrir el reproductor.

La aplicación interactúa con los siguientes endpoints del backend Spring Boot (`src/api/apoloApi.ts`):

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/users/{username}` | Consulta si un usuario ya existe en la base de datos. |
| `POST` | `/api/users` | Registra un nuevo usuario si no existía previamente. |
| `GET` | `/api/songs` | Obtiene hasta 100 canciones en la rama `main` actual. |
| `GET` | `/api/songs/similar?artist={artist}&songName={songName}` | Obtiene recomendaciones de canciones similares procesadas por el modelo de Machine Learning. |
| `POST` | `/api/listening-history` | Registra la selección como incompleta (`completed: false`); el reproductor actual no reproduce audio real. |
| `GET` | `/api/listening-history/user/{username}` | Obtiene los IDs del historial de un usuario. |
| `GET` | `/api/listening-history/song/{artist}/{songName}` | Obtiene los IDs del historial de una canción para cruzarlos con los del usuario. |
| `DELETE` | `/api/listening-history/{id}` | Elimina un registro del historial. |

Si el catálogo no se puede leer, Prometeo avisa y muestra canciones de ejemplo; esas canciones
se guardan únicamente en el dispositivo. Las recomendaciones por ubicación también son locales:
Apolo no expone un endpoint de tendencias geográficas. La interfaz identifica si la ubicación
proviene del GPS, de una estimación por IP o de un valor referencial. El historial visible se
guarda en el dispositivo; con una sesión sincronizada, las selecciones disponibles también se
envían a Apolo.

La respuesta del endpoint de canciones en `main` debe ser JSON válido para cargar el catálogo
real. Si la serialización de las relaciones de las entidades falla, el frontend no puede
reconstruir de forma fiable la lista y conserva el catálogo local de ejemplo. El reproductor
es una vista simulada: sus controles y progreso no reproducen ni descargan audio.

## 💡 Nota de Configuración de IP

En `src/api/apoloApi.ts`, el cliente usa por defecto `http://localhost:8080`.

- **Emulador o dispositivo por USB**: ejecuta `adb reverse tcp:8080 tcp:8080` para que `localhost:8080` del dispositivo llegue al backend de la computadora.
- Para Metro en un dispositivo físico, redirige también el puerto con `adb reverse tcp:8081 tcp:8081`.

Ten en cuenta que `adb reverse` se pierde al desconectar o reiniciar el dispositivo. Para usar la app sin USB, el backend debe estar accesible desde la red del teléfono; `localhost` no apunta a la computadora.