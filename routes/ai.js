const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize Google Gen AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==========================================
// GAURI'S MODULE: Extract Fingerprint & Story
// ==========================================
router.post('/process-product', async (req, res) => {
  try {
    const { imageBase64, mimeType, artisanVoiceText, preferredLanguage } = req.body;
    const prompt = `
      You are KARIGAR AI, an expert business manager for traditional artisans.
      Analyze the attached image of a handmade product along with the artisan's voice description: "${artisanVoiceText}".
      
      Perform 2 tasks and output strictly valid JSON:
      1. Extract the "Craft Fingerprint" (category, materials, motifs, colors, patterns, craftType).
      2. Write an authentic, compelling "Maker Story" in ${preferredLanguage || 'English'} preserving the artisan's narrative.
      Return JSON schema:
      {
        "craftFingerprint": {
          "category": "string",
          "materials": ["string"],
          "motifs": ["string"],
          "colors": ["string"],
          "patterns": ["string"],
          "craftType": "string"
        },
        "makerStory": "string"
      }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        }
      ],
      config: { responseMimeType: 'application/json' }
    });
    const parsedData = JSON.parse(response.text);
    res.json(parsedData);
  } catch (err) {
    console.error('AI Processing Error:', err);
    res.status(500).json({ error: 'AI vision & story extraction failed' });
  }
});

// =========================================================
// ARSHPREET'S MODULE: 1. Explainable Pricing Route
// =========================================================
router.post('/generate-pricing', async (req, res) => {
  try {
    const { craftFingerprint, materialCost, hoursSpent } = req.body;
    const baseLaborRate = 100; // INR per hour baseline
    const calculatedLaborCost = hoursSpent * baseLaborRate;
    
    const prompt = `
      You are an expert artisan fair-trade valuation engine.
      Craft Traits: ${JSON.stringify(craftFingerprint)}
      Base Material Cost: INR ${materialCost}
      Hours Spent: ${hoursSpent} hours
      Calculated Base Labor Cost: INR ${calculatedLaborCost}
      
      Calculate a fair price breakdown. Add a "craftsmanshipPremium" reflecting craft complexity.
      Provide a simple, encouraging explanation for the artisan in clear English and Hindi.
      Return JSON schema:
      {
        "recommendedPrice": number,
        "breakdown": {
          "materialCost": number,
          "laborCost": number,
          "craftsmanshipPremium": number,
          "margin": number
        },
        "explanation": "string"
      }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate explainable pricing' });
  }
});

// =========================================================
// ARSHPREET'S MODULE: 2. Market Repackaging Route
// =========================================================
router.post('/repackage-product', async (req, res) => {
  try {
    const { craftFingerprint, makerStory, basePrice } = req.body;
    
    const prompt = `
      You are KARIGAR AI's Market Repackaging Engine.
      Product Fingerprint: ${JSON.stringify(craftFingerprint)}
      Maker Story: ${makerStory}
      Base Recommended Price: INR ${basePrice}
      
      Repackage this single artisan product into 3 distinct buyer opportunities:
      1. Corporate Gifting
      2. Weddings & Festivals
      3. Boutique Retail / Export
      Return JSON array:
      [
        {
          "segment": "Corporate Gifting",
          "title": "string",
          "positioningPitch": "string",
          "suggestedBulkPrice": number
        },
        {
          "segment": "Weddings & Festivals",
          "title": "string",
          "positioningPitch": "string",
          "suggestedBulkPrice": number
        },
        {
          "segment": "Boutique Retail",
          "title": "string",
          "positioningPitch": "string",
          "suggestedBulkPrice": number
        }
      ]
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json({ marketListings: JSON.parse(response.text) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to repackage product for markets' });
  }
});

module.exports = router;