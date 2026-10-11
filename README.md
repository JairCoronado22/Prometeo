# Prometeo (React Native Client)

Aplicación móvil cliente para la exploración, búsqueda y gestión de canciones, desarrollada con React Native y TypeScript. Se conecta al servicio backend REST para la gestión de usuarios, catálogo musical, recomendaciones por similitud, geolocalización de tendencias e historial de reproducción.

## Arquitectura y Tecnologías

- **Framework**: React Native
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation (Native Stack)
- **Persistencia Local**: `@react-native-async-storage/async-storage`
- **Gestión de Estado y Hooks**: React Context API (`AuthContext`), `useLocation`
- **Geolocalización**: `PermissionsAndroid` + Geolocation API para detección de tendencias locales
- **Cliente HTTP**: Fetch API para interacción con el servidor REST

## Estructura del Proyecto

```
prometeo/
├── App.tsx                     # Punto de entrada de la aplicación
├── package.json                # Gestión de dependencias
├── tsconfig.json               # Configuración de TypeScript
└── src/
    ├── api/
    │   └── apoloApi.ts         # Cliente REST API
    ├── components/
    │   ├── LocationBanner.tsx  # Banner de geolocalización y tendencias geográficas
    │   └── SongItem.tsx        # Componente reutilizable para tarjetas de canciones
    ├── context/
    │   └── AuthContext.tsx     # Contexto global de sesión
    ├── hooks/
    │   └── useLocation.ts      # Custom hook para obtención de ubicación
    ├── navigation/
    │   └── AppNavigator.tsx    # Configuración de navegación de la app
    ├── screens/
    │   ├── LoginScreen.tsx     # Pantalla de inicio de sesión
    │   ├── MainScreen.tsx      # Exploración, catálogo y tendencias por zona
    │   └── HistoryScreen.tsx   # Historial de reproducción
    ├── services/
    │   ├── historyStorage.ts   # Persistencia local del historial
    │   └── locationService.ts  # Servicio de geolocalización GPS e IP
    └── types/
        └── index.ts            # Definición de tipos e interfaces
```

## Integración REST API y Geolocalización

Endpoints consumidos desde el servidor backend:

- `GET /api/users/{username}`: Consulta de información de usuario.
- `POST /api/users`: Registro de nuevo usuario.
- `GET /api/songs`: Obtención del catálogo completo de canciones.
- `GET /api/songs/similar?artist={artist}&songName={songName}`: Obtención de recomendaciones por similitud.
- `POST /api/listening-history`: Registro persistente de reproducciones con geolocalización.

La dirección base del servidor se configura en `src/api/apoloApi.ts` (`BASE_URL`).

## Requisitos e Instalación

### Prerrequisitos

- Node.js (v18+)
- JDK 17 (Java 17)
- Android Studio y SDK de Android configurado

### Instrucciones de Ejecución (PowerShell)

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno e iniciar emulador Android desde Android Studio (*Device Manager*).

3. Ejecutar en dispositivo/emulador Android con Java 17:
   ```powershell
   $env:JAVA_HOME="C:\Users\artik\.jdks\jbr-17.0.14"
   $env:ANDROID_HOME="C:\Users\artik\AppData\Local\Android\Sdk"
   $env:PATH="C:\Users\artik\AppData\Local\Android\Sdk\platform-tools;" + $env:PATH
   npx react-native run-android
   ```
