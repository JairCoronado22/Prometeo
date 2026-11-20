# Prometeo (Cliente React Native)

Prometeo es una aplicación móvil cliente de recomendación musical desarrollada con React Native y TypeScript. Se conecta a un servicio REST en Spring Boot (Java) para identificar usuarios, consultar el catálogo y las recomendaciones similares procesadas por Machine Learning, y registrar selecciones en el historial.

---

## Arquitectura y Tecnologías

- Framework Móvil: React Native (v0.74.5)
- Lenguaje: TypeScript
- Navegación: React Navigation (Native Stack)
- Gestión de Estado: React Context API (AuthContext)
- Custom Hooks: useLocation para geolocalización, useAuth para sesión, useShake para sensor de movimiento
- Notificaciones Locales / Push: Notificaciones nativas con canal de alta prioridad (songfinder-channel), vibración háptica y avisos en segundo plano al estar listas las recomendaciones
- Permisos de Android: Permisos en tiempo de ejecución para ubicación (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION) y notificaciones (POST_NOTIFICATIONS en Android 13+)
- Sensores: Acelerómetro para descubrir canciones similares al agitar el dispositivo
- Persistencia Local: @react-native-async-storage/async-storage
- Geolocalización: PermissionsAndroid + GPS Nativo / IP API fallback
- Cliente HTTP: Fetch API nativa con AbortController (timeout de 2.2s para respuesta instantánea) y fallback multi-IP (localhost, 10.0.2.2, IP local)
- Backend Integrado: Spring Boot + PostgreSQL (Apolo / prometeo en rama feat-notif)

---

## Requisitos del Sistema

Para ejecutar el proyecto cliente y conectarlo con el servidor backend:

- Node.js: v18.0.0 o superior
- JDK (Java Development Kit): Java 17
- Android Studio: Con SDK de Android (API 33+) y un emulador (AVD) o dispositivo físico conectado por USB con depuración activada.
- Servidor Backend: Proyecto Apolo (Spring Boot) corriendo en http://localhost:8080 (rama feat-notif).

---

## Estructura del Proyecto

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
    │   ├── NotificationPermissionCard.tsx # Permiso Android para notificaciones
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
    │   ├── locationService.ts  # Geolocalización nativa GPS / IP
    │   ├── localNotificationService.ts # Gestor de notificaciones nativas y push
    │   └── notificationPermissionService.ts # Permiso de notificaciones Android
    └── types/
        └── index.ts            # Interfaces y tipos de TypeScript
```

---

## Guía de Ejecución Paso a Paso (Para el Equipo)

### 1. Iniciar el Servidor Backend (Spring Boot)

En la carpeta del proyecto backend Apolo/prometeo:

```powershell
# 1. Entrar a la carpeta del backend
cd C:\ruta\a\prometeo

# 2. Cambiar a la rama de desarrollo
git checkout feat-notif
git pull origin feat-notif

# 3. Ejecutar el servidor (escucha en http://localhost:8080)
$env:JAVA_HOME="C:\ruta\a\jdk-17"
.\gradlew.bat bootRun
```
Asegúrate de que PostgreSQL esté corriendo en el puerto 5432 con la base de datos prometeo.

---

### 2. Configurar la Conexión USB del Celular / Emulador

Conecta tu teléfono físico por cable USB y verifica la conexión:

```powershell
# 1. Verificar que el dispositivo aparezca autorizado ("device")
adb devices

# 2. Redirigir puertos para conectar el teléfono con la PC
adb reverse tcp:8080 tcp:8080
adb reverse tcp:8081 tcp:8081
```

---

### 3. Iniciar el Cliente React Native (Prometeo)

En la carpeta del proyecto frontend react-native-songfinder:

```powershell
# 1. Entrar a la carpeta del cliente móvil
cd C:\ruta\a\react-native-songfinder

# 2. Asegurarse de estar en la rama principal
git checkout main
git pull origin main

# 3. Iniciar Metro Bundler
npx react-native start
```

---

### 4. Compilar y Abrir la App en el Celular

En una terminal adicional:

```powershell
npx react-native run-android
```

---

## Endpoints REST Consumidos

La aplicación interactúa con los siguientes endpoints del backend Spring Boot (src/api/apoloApi.ts):

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | /api/users/{username} | Consulta si un usuario ya existe en la base de datos. |
| POST | /api/users | Registra un nuevo usuario si no existía previamente. |
| GET | /api/songs | Obtiene el catálogo completo de canciones desde PostgreSQL. |
| GET | /api/songs/similar?artist={artist}&songName={songName} | Obtiene recomendaciones de canciones similares procesadas por el modelo de Machine Learning. |
| POST | /api/listening-history | Registra la selección escuchada en la base de datos del backend. |
| GET | /api/listening-history/user/{username} | Obtiene el historial guardado de un usuario. |
| POST | /api/notifications/register-token | Registra el token del dispositivo para notificaciones. |

---

## Funcionamiento de Notificaciones y Sensores

- Notificaciones Push / Locales: Al seleccionar una canción o agitar el teléfono, las recomendaciones se procesan en segundo plano. Cuando los temas similares están listos, la app dispara una Notificación Nativa de Android (Recomendaciones listas) con sonido y vibración.
- Modo Seguro: La app valida los módulos nativos y utiliza un sistema de degradación suave (fallback), garantizando que nunca se produzcan caídas ni avisos emergentes en pantalla.
- Acelerómetro (Gesto Shake): Al agitar el teléfono en la pantalla principal, la app vibra (Vibration.vibrate(80)) y consulta nuevas canciones recomendadas.
- Geolocalización Híbrida: Detecta la posición mediante GPS o IP (http://ip-api.com/json), ofreciendo sugerencias por ciudad (ej: Lima, Perú).
