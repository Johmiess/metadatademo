import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("api/.env")

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

query = "test"
try:
    response = supabase.table('dataset_metadata').select("*").or_(f"title.ilike.%{query}%,author.ilike.%{query}%,description.ilike.%{query}%").order("created_at", desc=True).execute()
    print("Success!", response.data)
except Exception as e:
    print("Error:", e)
