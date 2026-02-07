# ✦ NexusAI

### The Next-Generation AI Coding Assistant & WebDev Studio

NexusAI is a powerful, full-stack AI coding assistant designed to streamline your development workflow. It combines intelligent chat capabilities with a dedicated **WebDev Studio**, transforming your browser into a premium, IDE-like environment for instant web application generation.

---

## 🚀 Key Features

### 💻 WebDev Studio (New!)
Experience a complete IDE within your browser:
- **Full-Screen Editor**: Distraction-free coding environment with auto-hiding sidebar.
- **Multi-File Generation**: Automatically structures projects into `index.html`, `styles.css`, and `script.js` (or React components).
- **Live Preview**: Instantly render and interact with your generated code.
- **File Explorer**: Create, edit, and navigate files seamlessly.
- **Premium UI Engine**: The AI is fine-tuned to generate "Apple-quality" designs with glassmorphism, modern typography, and smooth animations.

### 🤖 Intelligent Chat Assistant
- **Multi-Model Support**: Switch between top-tier AI models (OpenAI, Gemini, Anthropic, etc.).
- **Smart Context**: Remembers conversation history and adapts to your coding style.
- **System Personas**: 
  - **Standard**: General-purpose assistant.
  - **Coder**: Expert frontend architect optimized for React, Vite, and Tailwind.
  - **Developer**: Focuses on architecture and clean code.

### 🛠️ Advanced Tooling
- **Artifacts System**: Generate downloadable files and full projects on demand.
- **Voice Mode**: (Experimental) Voice interaction support.
- **Memory Management**: Long-term memory for project-specific context.

---

## 🛠️ Tech Stack

Built with a modern, performance-first stack:
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion
- **Icons**: Lucide React
- **Backend/Services**: Node.js, Firebase (for auth/database)

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/NexusAI.git
   cd NexusAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Create a `.env` file if necessary (refer to `.env.example` if available).
   - Ensure you have valid API keys for the AI providers you wish to use.

---

## 🚦 Usage

NexusAI requires both the frontend and backend to be running.

### 1. Start the Backend Server
In a terminal, run:
```bash
npm run server
```

### 2. Start the Frontend Application
In a **new** terminal window, run:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🎨 WebDev Studio Guide

1. Click the **WebDev Studio** button in the sidebar (or top header).
2. Enter a prompt like:
   > "Build a landing page for a sci-fi game called 'Void Walker' with a neon purple theme and parallax scrolling."
3. Watch as NexusAI generates the file structure and code in real-time.
4. Use the **Editor** tab to modify code and the **Preview** tab to see changes instantly.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
