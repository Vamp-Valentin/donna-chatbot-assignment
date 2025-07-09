# Donna Chatbot 📝🤖

An AI-powered chatbot (Donna) that can help you log meetings, add notes to meetings, and chat using OpenAI.  
Built with React, Express and OpenAI GPT API.

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Vamp-Valentin/donna-chatbot.git
cd donna-chatbot
```

---a

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Set up your OpenAI API key

Create a `.env` file in the root of the project and add:

```
OPENAI_API_KEY=your-openai-key-here
```

You can generate an API key from [https://platform.openai.com/](https://platform.openai.com/).

**❗️ Important:** Do not share your `.env` file or your key publicly.

---

### 4️⃣ Build the React frontend

```bash
npm run build
```

This builds the React app into the `/build` folder for the server to serve.

---

### 5️⃣ Run the server

```bash
node server.js
```

The server starts on:  
🌐 http://localhost:3000

---

## 🧪 Features

✅ Add new meetings  
✅ Add notes to existing meetings  
✅ View your meetings & notes  
✅ Chat with Donna (uses OpenAI GPT)

---

## 🧹 Notes

- The meetings and notes are stored **in-memory** while the server runs. They reset when the server restarts.
- The `.env` file is ignored from git (`.gitignore`), but make sure it exists locally before running.

---

## 📂 Scripts

- Build frontend: `npm run build`
- Start server: `node server.js`

---

If you run into any issues or have questions, feel free to contact the maintainer.
