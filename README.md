# Domingo de Cine • Generador de Póster Cinematográfico

Una aplicación web moderna y modular construida con **React**, **TypeScript** y **Vite** para generar pósters retro de alta definición para noches de cine en casa y cine clubs.

---

## 📁 Arquitectura del Proyecto

El archivo monolítico original `index.html` ha sido simplificado y dividido en componentes modulares fuertemente tipados con TypeScript:

```
homecinema-poster/
├── index.html                   # HTML raíz limpio (fuentes Bebas Neue, Courier Prime, etc.)
├── package.json                 # Dependencias y scripts de desarrollo
├── tsconfig.json                # Configuración de TypeScript
├── vite.config.ts               # Configuración del bundler Vite
├── src/
│   ├── main.tsx                 # Punto de entrada de React 19
│   ├── App.tsx                  # Orquestador del estado y diseño principal
│   ├── App.css                  # Layout responsivo
│   ├── index.css                # Sistema de diseño, tokens, tipografías y variables CSS
│   │
│   ├── types/
│   │   └── poster.ts            # Interfaces TypeScript (MovieMetadata, ScheduleInfo, etc.)
│   │
│   ├── services/
│   │   ├── movieApi.ts          # Integración con iTunes API, duración y resolución HD
│   │   └── posterExport.ts      # Exportador de pósters HD en PNG con html2canvas
│   │
│   └── components/
│       ├── Header/
│       │   ├── Header.tsx       # Barra superior con distintivo y restablecer
│       │   └── Header.css
│       ├── Poster/
│       │   ├── PosterPreview.tsx# Lienzo del póster 2:3, textura de papel, ticket y créditos
│       │   └── PosterPreview.css
│       └── Controls/
│           ├── Controls.css     # Estilos de formularios, tarjetas, galería y sliders
│           ├── MovieSearchSection.tsx    # Búsqueda interactiva y galería de carátulas
│           ├── ImageAdjustmentSection.tsx # Sliders de encuadre vertical, zoom y subida local
│           ├── MovieDetailsSection.tsx   # Título, año, duración, director y género
│           ├── ScheduleSection.tsx       # Horarios, recordatorio y cabeceras
│           └── ExportSection.tsx         # Botón de descarga en alta resolución
```

---

## 🚀 Comandos

### Modo de desarrollo
```bash
npm run dev
```
Inicia el servidor local de desarrollo con HMR (Hot Module Replacement) en `http://localhost:5174/` (o puerto disponible).

### Compilación para producción
```bash
npm run build
```
Valida los tipos TypeScript y genera los paquetes optimizados en el directorio `dist/`.

### Vista previa del build de producción
```bash
npm run preview
```
