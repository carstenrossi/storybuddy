# Story Buddy - Dein serieller Geschichtenerzähler

Eine KI-gestützte Webapplikation zum gemeinsamen Erstellen serieller Geschichten mit kontextsensitivem Universum-Management.

## 🚀 Features

### 🧠 Zwei intelligente Modi

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

### 📁 Dateibasiertes Kontext-System

- **Markdown-basierte Speicherung** aller Kontext-Informationen
- **Automatische Integration** in AI-Gespräche
- **Versionskontrolle** durch Dateisystem
- **Einfache Bearbeitung** direkt in der App oder extern
- **Kategorisierung** nach Typen (Charakter, Ort, Geschichte, etc.)

### 🎨 Moderne Benutzeroberfläche

- Responsive Design für alle Geräte
- Dark/Light Mode Support
- Intuitive Navigation zwischen Modi
- Echtzeit-Chat Interface
- Übersichtliche Kontext-Verwaltung

## 🛠️ Technischer Stack

- **Frontend**: Next.js 14 mit TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Anthropic Claude API
- **Speicherung**: Dateibasiert (Markdown + JSON)
- **UI Components**: Lucide React Icons

## 📦 Installation

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- Anthropic API-Schlüssel

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
   
   Fügen Sie Ihren Anthropic API-Schlüssel in `.env.local` ein:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-api-key-here
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

4. **App öffnen**
   Besuchen Sie [http://localhost:3000](http://localhost:3000)

## 🎯 Verwendung

### Erste Schritte

1. **Brainstorming starten**: Wechseln Sie in den Brainstorming-Modus und beginnen Sie mit der Entwicklung Ihres Universums
2. **Kontext speichern**: Entwickelte Charaktere, Orte, etc. als Kontext-Dateien speichern
3. **Geschichten schreiben**: Im Schreiben-Modus das entwickelte Universum für Geschichten nutzen

### Kontext-Management

- **Neue Dateien**: Über das "+" im Kontext-Panel
- **Bearbeitung**: Klick auf Bearbeiten-Icon
- **Kategorien**: Character, Ort, Geschichte, Sonstiges
- **Automatische Integration**: Alle Dateien werden automatisch in AI-Gespräche einbezogen

### System-Prompt anpassen

Im Schreiben-Modus können Sie über das Einstellungen-Icon den System-Prompt anpassen, um:
- Schreibstil und Tonalität zu definieren
- Persönlichkeit des AI-Partners festzulegen
- Spezifische Richtlinien für Ihr Projekt zu setzen

## 📁 Projektstruktur

```
storybuddy/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── chat/         # Chat mit Claude
│   │   │   ├── context/      # Kontext-Verwaltung
│   │   │   └── settings/     # Einstellungen
│   │   ├── globals.css       # Globale Styles
│   │   ├── layout.tsx        # App Layout
│   │   └── page.tsx          # Hauptseite
│   └── components/           # React Komponenten
│       ├── ChatInterface.tsx
│       ├── ContextPanel.tsx
│       └── ModeSelector.tsx
├── data/                     # Automatisch erstellte Daten
│   ├── context/             # Kontext-Dateien (.md)
│   └── settings/            # App-Einstellungen
└── README.md
```

## 🔧 API-Endpunkte

- `GET /api/context` - Alle Kontext-Dateien laden
- `POST /api/context` - Neue Kontext-Datei erstellen
- `PATCH /api/context/[id]` - Kontext-Datei aktualisieren
- `DELETE /api/context/[id]` - Kontext-Datei löschen
- `GET/POST /api/settings/system-prompt` - System-Prompt verwalten
- `POST /api/chat` - Chat mit Claude (kontextsensitiv)

## 🌟 Besondere Features

### Kontextsensitive AI
Das System lädt automatisch alle Kontext-Dateien und integriert sie in jede AI-Unterhaltung, wodurch:
- Charaktere konsistent bleiben
- Das Universum zusammenhängend entwickelt wird
- Geschichten nahtlos in die etablierte Welt passen

### Dateisystem-Integration
Alle Kontext-Informationen werden als Markdown-Dateien gespeichert, die:
- Mit externen Tools bearbeitet werden können
- Versionskontrolle ermöglichen
- Einfache Backups erlauben
- Portabilität gewährleisten

### Flexible Modi
- **Brainstorming**: Speziell optimiert für kreative Weltentwicklung
- **Schreiben**: Fokussiert auf Geschichtenerstellung mit anpassbarem Stil

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

**API-Fehler**: Stellen Sie sicher, dass Ihr ANTHROPIC_API_KEY korrekt gesetzt ist
**Keine Kontext-Dateien**: Das `data/context` Verzeichnis wird automatisch erstellt
**Build-Fehler**: Führen Sie `npm install` erneut aus

---

Viel Spaß beim Erstellen Ihrer Geschichten! 📚✨ 