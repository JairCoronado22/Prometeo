# Prometeo — App móvil (React Native)

App Android de recomendación musical. Muestra el catálogo de canciones, busca por nombre o artista, reproduce canciones y recomienda canciones parecidas usando el modelo de Machine Learning del backend (Spring Boot). También recomienda canciones al azar por notificación (botón 🎲 o agitando el teléfono) y sugiere canciones según tu ubicación.

El backend (API REST) está en el repositorio **Prometeo-Backend**.

---

## Funcionalidades

- **Catálogo**: las 20 canciones más populares; toda la pantalla hace scroll y se recarga deslizando hacia abajo.
- **Búsqueda**: busca en el backend mientras escribes (máx. 20 resultados), con botón ✕ para limpiar.
- **Reproductor**:
  - Las **10 primeras canciones del catálogo suenan de verdad** (MP3 incluidos en la app): barra arrastrable sincronizada, ±10 s, pausa/reanudar.
  - El resto de canciones usa una **vista previa simulada** (misma barra y controles, sin audio).
  - Debajo de los controles: **"A continuación · Recomendadas"** (cola de 20 canciones parecidas, como en Spotify). Tocar una la reproduce y carga su propia cola.
  - El botón Atrás de Android cierra el reproductor.
- **🎲 Recomiéndame una canción** (pantalla principal) o **agitar el teléfono** (en cualquier pantalla): elige una canción al azar y la envía como notificación; al tocarla se abre en el reproductor.
- **Notificaciones**: bienvenida al entrar y "🎲 Te recomendamos…". Si falta el permiso, la tarjeta muestra "Activar".
- **Canciones de tu zona**: con permiso de ubicación, una barra plegable (▸/▾) con hasta 10 sugerencias locales; recuerda si la dejaste abierta.
- **Historial** local (AsyncStorage) y sincronizado con el backend para usuarios con nombre.
- **Sin conexión**: aviso con botón "Reintentar" y canciones de ejemplo.

---

## Tecnologías

| | |
|---|---|
| Framework | React Native 0.74.5 (arquitectura antigua, `newArchEnabled=false`), TypeScript |
| Navegación | React Navigation (native stack) |
| Estado | React Context (`AuthContext`) |
| Audio | `react-native-sound` (MP3 empaquetados como recursos `raw`) |
| Notificaciones | `react-native-push-notification` (locales, canal `songfinder-channel`) |
| Sensores | `react-native-sensors` (acelerómetro) |
| Ubicación | `@react-native-community/geolocation` + respaldo por IP |
| Persistencia | `@react-native-async-storage/async-storage` |
| Tests | Vitest |

---

## Requisitos

- **Node.js 18+**
- **JDK 17 o 21** (probado con JBR 21). Gradle wrapper 8.6.
- **Android SDK** con licencias aceptadas (Gradle descarga solo la plataforma 34, build-tools 34, NDK y CMake que falten).
- Un teléfono Android con **depuración USB o inalámbrica**, o un emulador.
- La carpeta **`Canciones/`** con los MP3 (ver más abajo).

> No pongas `org.gradle.java.home` en `android/gradle.properties` con rutas de tu PC: rompe el build en otras máquinas. Usa `JAVA_HOME`.

---

## Estructura

```
Prometeo-Frontend/
├── App.tsx
├── Canciones/                        # MP3 locales "Nombre - Artista.mp3" (ver aviso)
├── android/                          # Proyecto nativo
├── tests/                            # Vitest
└── src/
    ├── api/apoloApi.ts               # Cliente REST: CLOUD_URL, límites, timeout 2,2 s y URLs de respaldo
    ├── components/
    │   ├── LocationBanner.tsx        # Permiso de ubicación / barra plegable "Canciones de tu zona"
    │   ├── NotificationPermissionCard.tsx  # Permiso de notificaciones + 🎲
    │   ├── SeekBar.tsx               # Barra de progreso arrastrable
    │   └── SongItem.tsx
    ├── context/AuthContext.tsx
    ├── data/
    │   ├── localSongs.ts             # Lista fija de "Canciones de tu zona"
    │   └── localTracks.ts            # Canción del catálogo → MP3 de /Canciones
    ├── hooks/
    │   ├── usePlayback.ts            # Reproducción real (MP3) o simulada
    │   ├── useLocation.ts
    │   └── useShake.ts
    ├── navigation/AppNavigator.tsx
    ├── screens/                      # Login, Main (catálogo + reproductor), History
    ├── services/                     # Notificaciones, ubicación, historial, permisos
    ├── types/index.ts
    └── utils/songDisplay.ts          # Formato de nombres, % de similitud, elección al azar
```

---

## Configuración

En `src/api/apoloApi.ts`:

| Constante | Uso |
|---|---|
| `CLOUD_URL` | URL pública del backend (Railway). Se prueba primero; vacía = solo URLs locales. |
| `BASE_URLS` | Respaldo local: `localhost:8080`, `10.0.2.2:8080` (emulador), IP de la LAN. |
| `MAIN_MENU_LIMIT` = 20 | Canciones del menú principal. |
| `SEARCH_LIMIT` = 20 | Resultados de búsqueda y recomendadas. |
| `LOCAL_SONGS_LIMIT` = 10 | Canciones de la zona. |

Cada petición se corta a los **2,2 s** y pasa a la siguiente URL.

### Audio local (`Canciones/`)

Los MP3 se empaquetan dentro del APK (~30 MB). La correspondencia con el catálogo está en `src/data/localTracks.ts`; la clave es el nombre **tal como viene del backend** (algunos archivos se llaman distinto, p. ej. `Tusa - Karol G.mp3` ↔ `Tusa` / `KAROL G`).

Para añadir una canción: copia el `.mp3` a `Canciones/` y agrega una línea en `localTracks.ts`.

> ⚠️ Son canciones con derechos de autor: **no las subas a un repositorio público** ni publiques el APK. Si `Canciones/` no está en el repo, cópiala antes de compilar; si falta un archivo referenciado en `localTracks.ts`, el build falla.

---

## Desarrollo

```powershell
npm install
npx react-native start
```

En otra terminal, con el teléfono conectado:

```powershell
adb devices
adb reverse tcp:8081 tcp:8081    # Metro
adb reverse tcp:8080 tcp:8080    # solo si usas el backend local
npx react-native run-android
```

---

## Generar e instalar el APK (release)

```powershell
$env:JAVA_HOME = "C:\ruta\a\jdk-21"; $env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd android
.\gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```

- APK: `android/app/build/outputs/apk/release/app-release.apk` (~84 MB con los MP3).
- La primera compilación tarda ~7 min (descarga NDK/CMake); las siguientes, < 1 min.
- El `release` se firma con `android/app/debug.keystore`: sirve para instalar por adb y para demos, **no para Play Store**.

---

## Tests

```powershell
npx tsc --noEmit -p .
npx vitest run
```

- `tests/songDisplay.test.ts`: formato de nombres, porcentaje de similitud, elección al azar, correspondencia de nombres de MP3.
- `tests/apoloApi.test.ts`: **2 tests desactualizados** (esperan `fetch` sin `AbortController` y una sola URL); fallan desde antes de los cambios actuales.

---

## Endpoints que usa la app

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/api/songs?limit=20` | Menú principal (y `limit=50` para el 🎲). |
| GET | `/api/songs/search?q=…&limit=20` | Búsqueda. |
| GET | `/api/songs/similar?artist=…&songName=…&limit=20` | Cola de recomendadas. |
| GET / POST | `/api/users/{username}` / `/api/users` | Login / registro automático. |
| GET / POST / DELETE | `/api/listening-history…` | Historial. |
| POST / DELETE | `/api/notifications/register-token`, `/unregister-token` | Token del dispositivo. |
| POST | `/api/notifications/send-song` | Registro en el log de cada recomendación 🎲. |

---

## Problemas conocidos

- **Similitud ≈ 99 % en casi todo**: el modelo del backend no normaliza las variables (`tempo` y duración dominan).
- **Canciones de tu zona**: lista fija de 4 canciones que no están en el catálogo del backend; sus recomendadas salen de una lista de respaldo.
- **Primera petición lenta en algunas redes**: si el DNS del router tarda en responder consultas IPv6, la primera llamada puede pasar de 2,2 s. En el teléfono: Ajustes → Red → DNS privado → `dns.google`.
- **Agitar** depende del acelerómetro; en emuladores puede no estar disponible (la app lo indica).
