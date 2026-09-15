from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from google import genai
from dotenv import load_dotenv

import json
import os

# =========================
# Load Environment Variables
# =========================

load_dotenv()

# =========================
# Load Crafts Dataset
# =========================

with open("data/crafts.json", "r", encoding="utf-8") as f:
    crafts = json.load(f)

# =========================
# Convert Crafts to Documents
# =========================

docs = []

for craft in crafts:
    content = f"""
Craft: {craft['craft']}
State: {craft['state']}
Materials: {', '.join(craft['materials'])}
Categories: {', '.join(craft['categories'])}
Markets: {', '.join(craft['target_markets'])}
Description: {craft['description']}
"""

    docs.append(
        Document(
            page_content=content,
            metadata={"craft": craft["craft"]}
        )
    )

# =========================
# Embeddings Model
# =========================

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# =========================
# Vector Database
# =========================

db = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

print(f"✅ Vector DB created with {len(docs)} documents")

# =========================
# Retriever
# =========================

retriever = db.as_retriever(
    search_kwargs={"k": 1}
)

# =========================
# User Query
# =========================

query = input("Enter craft query: ")

retrieved_docs = retriever.invoke(query)

# Use only the most relevant craft
context = retrieved_docs[0].page_content

print("\nRetrieved Craft:")
print("=" * 80)
print(context)
print("=" * 80)

# =========================
# Gemini Client
# =========================

client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY")
)

# =========================
# Craft Fingerprint + Story Prompt
# =========================

prompt = f"""
You are KARIGAR AI.

Craft Information:

{context}

User Query:
{query}

Generate:

1. Craft Fingerprint
2. Marketing Tagline
3. Maker Story (120-150 words)

Return ONLY valid JSON.

{{
  "fingerprint": {{
    "craft_name": "",
    "region": "",
    "materials": [],
    "motifs": [],
    "patterns": []
  }},
  "tagline": "",
  "maker_story": ""
}}

Rules:
- Extract materials from the craft information.
- Infer common motifs associated with the craft.
- Infer common artistic patterns associated with the craft.
- Maker story should be professional and engaging.
- Return ONLY JSON.
"""

# =========================
# Gemini Response
# =========================

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)

print("\nRaw Gemini Response:")
print("=" * 80)
print(response.text)
print("=" * 80)

# =========================
# Convert JSON Response
# =========================

try:
    clean_text = (
        response.text
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    result = json.loads(clean_text)

    print("\nCRAFT FINGERPRINT")
    print("=" * 80)
    print(json.dumps(result["fingerprint"], indent=4))

    print("\nTAGLINE")
    print("=" * 80)
    print(result["tagline"])

    print("\nMAKER STORY")
    print("=" * 80)
    print(result["maker_story"])

except Exception as e:
    print("\n❌ JSON Parsing Error")
    print(e)