# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Cook-Along App

## Getting Started

Follow these steps to set up and run the application on your local machine:

### 1. Clone the Repository

```
git clone <your-repo-url>
cd cook-along-app
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed (v16 or higher recommended).

```
npm install
```

### 3. Create a `.env` File

Create a `.env` file in the root of the `cook-along-app` directory with the following content:

```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

- Replace `your_openai_api_key_here` with your actual OpenAI API key.
- **Never commit your real API key to version control!**

### 4. Start the Development Server

```
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## Notes
- This app uses Vite + React.
- You need an OpenAI API key with access to the Chat Completions endpoint.
- For production, follow best practices for environment variables and API key security.

---

## Troubleshooting
- If you see errors about missing dependencies, run `npm install` again.
- If the app can't find your API key, double-check your `.env` file and restart the dev server after changes.

---

Happy cooking! 🍳
