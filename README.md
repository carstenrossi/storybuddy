# Storybuddy - Dein Partner für die Entwicklung von großartigen Geschichten

Eine fortschrittliche KI-gestützte Webapplikation zum gemeinsamen Erstellen serieller Geschichten mit intelligentem Publikations-Management, kontextsensitivem Universum-System und Zugang zu über 300 verschiedenen KI-Modellen.

## 🚀 Features

### 📚 Intelligentes Publikations-Management
- **Multi-Publikations-System**: Verwaltung mehrerer Geschichtenprojekte parallel
- **Isolierte Datenstruktur**: Jede Publikation hat eigene Sessions, Kontext-Dateien und Einstellungen
- **Nahtloser Wechsel**: Schneller Wechsel zwischen verschiedenen Projekten
- **Automatische Datenmigration**: Upgrade bestehender Daten bei neuen Features

### 🧠 Zwei spezialisierte Modi

**Brainstorming-Modus**
- Entwicklung von Story-Universen
- Charaktere, Orte, Objekte, Geschichte
- Geographie, Soziologie, Psychologie  
- Glaubenssysteme, Wissenschaft, Magie
- Kreative Ideenfindung und Vertiefung

**Schreiben-Modus**
- Gemeinsames Schreiben von Geschichten
- Nutzung des entwickelten Universums
- Anpassbarer System-Prompt für Stil und Tonalität
- Konsistente Charakterentwicklung

### 🤖 Revolutionäre KI-Integration

**322+ Verfügbare Modelle über OpenRouter**
- **Allgemeine Modelle**: Claude 3.5 Sonnet/Haiku, GPT-4o/4o-mini, Gemini Pro 1.5, Llama 3.1 405B
- **Creative Writing Spezialist**: Modelle optimiert für kreatives Schreiben
- **NSFW-Modelle**: Für Geschichten mit erwachsenen Inhalten
- **Budget-Modelle**: Kostengünstige Alternativen für umfangreiche Projekte

**Intelligente Modell-Auswahl**
- **Session-spezifische Modelle**: Verschiedene Modelle für verschiedene Sessions
- **Kategorisierte Anzeige**: Übersichtliche Gruppierung nach Verwendungszweck
- **Suchfunktion**: Schnelles Finden des passenden Modells
- **Modell-Details**: Vollständige Informationen zu jedem Modell
- **Performance-Caching**: Intelligente Zwischenspeicherung für schnelle Ladezeiten

### 📁 Fortschrittliches Kontext-System

**Publikations-spezifische Kontexte**
- **Markdown-basierte Speicherung** aller Kontext-Informationen
- **Automatische Integration** in AI-Gespräche basierend auf Publikation
- **Mode-spezifische Anzeige**: Brainstorming zeigt Kontext-Dateien, Schreiben zeigt Kapitel
- **Echtzeit-Updates**: Sofortige UI-Aktualisierung bei Kontext-Änderungen
- **Cross-Component-Kommunikation**: Nahtlose Datenübertragung zwischen Komponenten

**Intelligente Kategorisierung**
- Automatische Trennung von Kontext-Dateien und Kapiteln
- Typ-basierte Organisation (Charakter, Ort, Geschichte, etc.)
- Mode-abhängige Filterung für optimierte Übersicht

### 🔄 Erweiterte Session-Verwaltung

**Mode-spezifische Sessions**
- Getrennte Session-Verwaltung für Brainstorming und Schreiben
- **Automatisches Session-Loading**: Lädt automatisch die zuletzt verwendete Session beim Mode-Wechsel
- **Session-spezifische Modell-Auswahl**: Jede Session kann ein anderes KI-Modell verwenden
- **Intelligente Session-Navigation**: Nahtloser Wechsel zwischen Sessions und Modi

### 🎨 Moderne Benutzeroberfläche

- **Responsive Design** für alle Geräte
- **Dark/Light Mode** Support  
- **Intuitive Navigation** zwischen Modi und Publikationen
- **Echtzeit-Chat Interface** mit modernen UI-Komponenten
- **Übersichtliche Kontext-Verwaltung** mit sofortigen Updates
- **Moderner Model-Selector** mit Kategorien und Suchfunktion

## 🛠️ Technischer Stack

- **Frontend**: Next.js 14 mit TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenRouter API (322+ Modelle)
- **Speicherung**: Dateibasiert (Markdown + JSON)
- **UI Components**: Lucide React Icons
- **Performance**: Intelligentes Caching-System
- **Architektur**: App Router mit modernen React Patterns

## 📦 Installation

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- OpenRouter API-Schlüssel ([OpenRouter.ai](https://openrouter.ai/))

### Setup

1. **Repository klonen und Dependencies installieren**
   ```bash
   git clone <repository-url>
   cd storybuddy
   npm install
   ```

2. **Umgebungsvariablen konfigurieren**
   ```bash
   cp env.example .env.local
   ```
   
   Fügen Sie Ihren OpenRouter API-Schlüssel in `.env.local` ein:
   ```
   OPENROUTER_API_KEY=sk-or-v1-ihr-api-key-hier
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

4. **App öffnen**
   Besuchen Sie [http://localhost:3000](http://localhost:3000)

## 🎯 Verwendung

### Erste Schritte

1. **Publikation erstellen**: Erstellen Sie ein neues Geschichtenprojekt
2. **Brainstorming starten**: Entwickeln Sie Ihr Universum mit verschiedenen KI-Modellen
3. **Kontext speichern**: Entwickelte Charaktere, Orte, etc. als Kontext-Dateien speichern  
4. **Geschichten schreiben**: Im Schreiben-Modus das entwickelte Universum für Geschichten nutzen
5. **Modelle wechseln**: Experimentieren Sie mit verschiedenen KI-Modellen für verschiedene Aufgaben

### Publikations-Management

- **Neue Publikation**: "Neue Publikation" Button in der Seitenleiste
- **Publikation wechseln**: Dropdown-Auswahl in der oberen Navigation
- **Isolierte Daten**: Jede Publikation hat eigene Sessions und Kontext-Dateien
- **Automatische Migration**: Bestehende Daten werden automatisch aktualisiert

### Modell-Auswahl

**Kategorien:**
- **Allgemein**: Claude, GPT, Gemini für vielseitige Anwendungen
- **Creative Writing**: Speziell für kreatives Schreiben optimierte Modelle
- **NSFW**: Für Geschichten mit erwachsenen Inhalten
- **Budget**: Kostengünstige Modelle für umfangreiche Projekte

**Features:**
- **Suchfunktion**: Schnelles Finden des passenden Modells
- **Session-spezifisch**: Verschiedene Modelle für verschiedene Sessions
- **Modell-Details**: Beschreibung, Kontext-Länge, Anbieter-Informationen
- **Performance**: Intelligentes Caching (7ms vs 400ms bei API-Aufrufen)

### Kontext-Management

**Mode-spezifische Anzeige:**
- **Brainstorming**: Zeigt alle Kontext-Dateien (Charaktere, Orte, etc.)  
- **Schreiben**: Zeigt geschriebene Kapitel in separater Sektion

**Verwaltung:**
- **Neue Dateien**: Über das "+" im Kontext-Panel
- **Bearbeitung**: Klick auf Bearbeiten-Icon mit sofortiger UI-Aktualisierung
- **Kategorien**: Character, Ort, Geschichte, Sonstiges
- **Automatische Integration**: Alle Dateien werden automatisch in AI-Gespräche einbezogen

### Session-Verwaltung

- **Mode-Switching**: Automatisches Laden der letzten Session beim Mode-Wechsel
- **Neue Sessions**: Automatische Erstellung beim ersten Chat in einem Mode
- **Session-History**: Alle Sessions bleiben erhalten und sind über Seitenleiste zugänglich
- **Cross-Mode-Navigation**: Nahtloser Wechsel zwischen Brainstorming und Schreiben

## 📁 Projektstruktur

```
storybuddy/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── chat/         # Chat mit KI-Modellen
│   │   │   ├── context/      # Kontext-Verwaltung  
│   │   │   ├── sessions/     # Session-Management
│   │   │   ├── publications/ # Publikations-Management
│   │   │   ├── models/       # OpenRouter Model-Integration
│   │   │   ├── settings/     # System-Einstellungen
│   │   │   └── migrate/      # Daten-Migration
│   │   ├── globals.css       # Globale Styles
│   │   ├── layout.tsx        # App Layout
│   │   └── page.tsx          # Hauptseite
│   └── components/           # React Komponenten
│       ├── ChatInterface.tsx      # Haupt-Chat-Interface
│       ├── ContextPanel.tsx       # Kontext-Verwaltung
│       ├── ModeSelector.tsx       # Mode-Umschaltung  
│       ├── PublicationSelector.tsx # Publikations-Auswahl
│       ├── SessionList.tsx        # Session-Liste
│       └── ModelSelector.tsx      # KI-Modell-Auswahl
├── data/                     # Automatisch erstellte Daten
│   ├── publications/         # Publikations-spezifische Daten
│   │   ├── [id]/
│   │   │   ├── context/     # Kontext-Dateien (.md)
│   │   │   └── sessions/    # Session-Daten (.json)
│   └── settings/            # Globale App-Einstellungen
└── README.md
```

## 🔧 API-Endpunkte

### Publikations-Management
- `GET/POST /api/publications` - Publikationen verwalten
- `GET/PUT/DELETE /api/publications/[id]` - Einzelne Publikation verwalten

### Session-Management  
- `GET/POST /api/sessions` - Sessions laden/erstellen
- `GET/PUT/DELETE /api/sessions/[id]` - Einzelne Session verwalten

### Kontext-System
- `GET /api/context` - Kontext-Dateien laden (publikations-spezifisch)
- `POST /api/context` - Neue Kontext-Datei erstellen
- `PATCH /api/context/[id]` - Kontext-Datei aktualisieren  
- `DELETE /api/context/[id]` - Kontext-Datei löschen

### KI-Integration
- `GET /api/models` - Verfügbare KI-Modelle laden (mit Caching)
- `POST /api/chat` - Chat mit ausgewähltem KI-Modell

### Einstellungen
- `GET/POST /api/settings/system-prompt` - System-Prompt verwalten
- `GET /api/migrate` - Daten-Migration durchführen

## 🌟 Besondere Features

### OpenRouter-Integration
Das System bietet Zugang zu **322+ KI-Modellen** von verschiedenen Anbietern:
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-3.5 Turbo
- **Google**: Gemini Pro 1.5, Gemini Flash
- **Meta**: Llama 3.1 405B, Llama 3.1 70B/8B
- **Spezialist**: Modelle für Creative Writing und NSFW-Inhalte

### Intelligentes Caching-System
- **1-Stunden-Cache**: Modelle werden zwischengespeichert
- **7ms Antwortzeit**: Für gecachte Anfragen vs 400ms für API-Aufrufe
- **Automatische Aktualisierung**: Cache läuft ab und wird bei Bedarf erneuert
- **Fallback-System**: Robuste Fehlerbehandlung bei API-Ausfällen

### Kontextsensitive AI
Das System lädt automatisch alle publikations-spezifischen Kontext-Dateien und integriert sie in jede AI-Unterhaltung, wodurch:
- Charaktere über Sessions hinweg konsistent bleiben
- Das Universum zusammenhängend entwickelt wird  
- Geschichten nahtlos in die etablierte Welt passen
- Mode-spezifische Kontexte intelligent verwaltet werden

### Cross-Component-Kommunikation
Implementiert ein robustes System für Echtzeit-Updates:
- **Sofortige UI-Aktualisierung** bei Kontext-Änderungen
- **Callback-basierte Kommunikation** zwischen Komponenten
- **Fallback-Mechanismen** für robuste Fehlerbehandlung
- **State-Management** ohne externe Libraries

### Performance-Optimierung
- **Intelligentes Caching** für API-Aufrufe
- **Lazy Loading** für umfangreiche Modell-Listen
- **Efficient Re-rendering** durch optimierte React-Patterns
- **Minimale Bundle-Größe** durch Tree-Shaking

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte:
1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch  
3. Committen Sie Ihre Änderungen
4. Erstellen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

## 🆘 Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die häufigen Probleme unten
2. Erstellen Sie ein Issue im Repository
3. Kontaktieren Sie das Entwicklungsteam

### Häufige Probleme

**API-Fehler**: Stellen Sie sicher, dass Ihr OPENROUTER_API_KEY korrekt gesetzt ist
**Keine Modelle**: Überprüfen Sie Ihre Internetverbindung und API-Schlüssel  
**Session-Probleme**: Daten werden automatisch migriert, ältere Sessions funktionieren weiterhin
**Build-Fehler**: Führen Sie `npm install` erneut aus

---

Viel Spaß beim Erstellen Ihrer Geschichten mit der Kraft von 322+ KI-Modellen! 📚✨ 