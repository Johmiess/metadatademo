import os
import io
import json
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types
import pandas as pd
from prompts import DATA_LIBRARIAN_PROMPT

load_dotenv()

app = Flask(__name__)
# Enable CORS for the Vite React frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Gemini
gemini_key = os.environ.get("GEMINI_API_KEY")
if not gemini_key:
    raise ValueError("Missing Gemini API Key in .env")

genai_client = genai.Client(api_key=gemini_key)

BUCKET_NAME = "research_datasets"

@app.route("/api/upload-and-generate", methods=["POST"])
def upload_and_generate():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    description = request.form.get('description', '')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Only CSV files are supported"}), 400

    try:
        file_bytes = file.read()
        
        # Extract headers using pandas
        df = pd.read_csv(io.BytesIO(file_bytes), nrows=0)
        headers = df.columns.tolist()

        # Upload to Supabase Storage
        file_ext = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Setting content type explicitly
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": "text/csv"}
        )

        public_url_res = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
        file_url = public_url_res

        # Call Gemini
        prompt_content = f"Dataset Description:\n{description}\n\nCSV Headers:\n{headers}"
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=DATA_LIBRARIAN_PROMPT,
                response_mime_type="application/json",
            )
        )
        
        try:
            metadata_json = json.loads(response.text)
        except json.JSONDecodeError:
            print("Failed to parse Gemini output:", response.text)
            return jsonify({"error": "Failed to generate structured metadata from AI"}), 500

        # Inject file_url
        metadata_json['file_url'] = file_url
        metadata_json['description'] = description

        return jsonify(metadata_json), 200

    except Exception as e:
        print(f"Error in upload_and_generate: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/save-metadata", methods=["POST"])
def save_metadata():
    data = request.get_json()
    if not data:
        return jsonify({"error": ["Invalid JSON payload"]}), 400

    errors = []
    required_fields = ['title', 'author', 'funding_agency', 'file_url']
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            errors.append(f"Field '{field}' is required and cannot be empty.")
    
    if errors:
        return jsonify({"error": errors}), 400
    
    # Prepare payload for Supabase
    db_payload = {
        "title": data.get("title"),
        "author": data.get("author"),
        "funding_agency": data.get("funding_agency"),
        "date_collected": data.get("date_collected"),
        "geographic_location": data.get("geographic_location"),
        "variables_defined": data.get("variables_defined"),
        "file_url": data.get("file_url"),
        "description": data.get("description", "")
    }

    try:
        # Insert into dataset_metadata
        response = supabase.table('dataset_metadata').insert(db_payload).execute()
        return jsonify({"message": "Successfully saved dataset metadata", "data": response.data}), 201
    except Exception as e:
        print(f"Error saving to DB: {e}")
        return jsonify({"error": [str(e)]}), 500


@app.route("/api/search", methods=["GET"])
def search_repository():
    query = request.args.get('q', '')
    try:
        if not query:
            # Return recent ones if no query
            response = supabase.table('dataset_metadata').select("*").order("created_at", desc=True).limit(50).execute()
        else:
            # Supabase ilike on multiple fields using or
            response = supabase.table('dataset_metadata').select("*").or_(f"title.ilike.%{query}%,author.ilike.%{query}%,description.ilike.%{query}%").order("created_at", desc=True).execute()
        
        return jsonify(response.data), 200
    except Exception as e:
        print(f"Error in search: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)
