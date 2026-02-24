# University Research Data Repository

This is a prototype web application designed to demonstrate AI-powered metadata extraction from dataset uploads. Built using a React frontend, a Python Flask backend, and integrated with Supabase and Gemini. The application is ready to deploy effortlessly on Vercel as a fullstack application, and protected by a password barrier.

## Project Structure

The project has been restructured for zero-config Vercel deployment:
- `api/`: Python Flask API server. Vercel automatically exposes files in this directory as serverless functions.
- `src/`, `public/`, `package.json`, `index.html`, `vite.config.ts`: React + Vite single-page frontend.

---

## How to Run Locally

You will need two separate terminal windows/tabs, one for the backend API and one for the frontend.

### 1. Running the Backend Server (Terminal 1)

The backend handles the routing, database interactions, and the Gemini AI inference.

```bash
# 1. Create and activate a Conda environment (only needed the first time)
conda create -n metadatademo python=3.10 -y
conda activate metadatademo

# 2. Install dependencies
pip install -r requirements.txt

# 3. Ensure your environment variables are set up
# (The api/.env file should already contain SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY)

# 4. Start the Flask application
python api/app.py
```

The backend server will start on `http://localhost:5001`.

### 2. Running the Frontend Application (Terminal 2)

The frontend is built using React and Vite, delivering the interactive user interface.

```bash
# 1. Install dependencies (if you haven't already)
npm install

# 2. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`. Open this URL in your web browser to interact with the dashboard.
Vite proxy automatically forwards all `/api/...` requests to `http://localhost:5001`.

---

## Testing the Application

1. Ensure both the Flask server and Vite development server are running concurrently.
2. Open `http://localhost:5173` in your browser.
3. You will be greeted by a password screen. Enter the password `1234` to login.
4. In the **Upload Dataset** tab, you can test the upload flow using the provided `sample_climate_data.csv` found in the root of this project.
5. Fill out a description, e.g., "Global climate data covering city statistics", and click **Generate Metadata with AI**.
6. The form will pre-populate based on the CSV headers. Complete the submission and view it in the **Search Repository** tab!

## Deployment to Vercel
Simply push this repository to GitHub and connect it to a new project in Vercel. Vercel will automatically build the React user interface and deploy the Python app using standard serverless instances. There is nothing else to configure!
