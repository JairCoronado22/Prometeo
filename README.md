# Prometeo (Cliente React Native)

**Prometeo** es una aplicación móvil cliente de recomendación musical inteligente desarrollada con **React Native** y **TypeScript**. Se conecta a un servicio backend REST en **Spring Boot (Java)** para ofrecer autenticación de usuarios, catálogo musical, recomendación de canciones similares mediante **Machine Learning**, geolocalización de tendencias locales e historial persistente de reproducción.

---

## 🚀 Arquitectura y Tecnologías

- **Framework Móvil**: React Native (v0.74.5)
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation (Native Stack)
- **Gestión de Estado**: React Context API (`AuthContext`)
- **Custom Hooks**: `useLocation` para geolocalización, `useAuth` para sesión
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
    │   ├── LocationBanner.tsx  # Banner visual de tendencias según ubicación
    │   └── SongItem.tsx        # Tarjeta reutilizable para canciones
    ├── context/
    │   └── AuthContext.tsx     # Contexto global de sesión de usuario
    ├── hooks/
    │   └── useLocation.ts      # Hook personalizado para geolocalización
    ├── navigation/
    │   └── AppNavigator.tsx    # Configuración de rutas (Stack Navigator)
    ├── screens/
    │   ├── LoginScreen.tsx     # Inicio de sesión y registro automático
    │   ├── MainScreen.tsx      # Exploración, catálogo y recomendaciones ML
    │   └── HistoryScreen.tsx   # Historial local persistente
    ├── services/
    │   ├── historyStorage.ts   # Persistencia local con AsyncStorage
    │   └── locationService.ts  # Servicio de geolocalización GPS / IP
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

La aplicación interactúa con los siguientes endpoints del backend Spring Boot (`src/api/apoloApi.ts`):

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/users/{username}` | Consulta si un usuario ya existe en la base de datos. |
| `POST` | `/api/users` | Registra un nuevo usuario si no existía previamente. |
| `GET` | `/api/songs` | Obtiene el catálogo completo de canciones. |
| `GET` | `/api/songs/similar?artist={artist}&songName={songName}` | Obtiene recomendaciones de canciones similares procesadas por el modelo de Machine Learning. |
| `POST` | `/api/listening-history` | Registra de forma persistente cada reproducción de canción. |

---

## 💡 Nota de Configuración de IP

En `src/api/apoloApi.ts`, la variable `BASE_URL` está configurada por defecto como:
`export const BASE_URL = 'http://10.0.2.2:8080';`

- **Emuladores de Android Studio**: `http://10.0.2.2:8080` apunta de manera nativa al `localhost:8080` de tu computadora.
- **Dispositivo Físico**: Al ejecutar `adb reverse tcp:8080 tcp:8080`, `http://10.0.2.2:8080` o `http://localhost:8080` funcionará automáticamente sin necesidad de modificar el código.
