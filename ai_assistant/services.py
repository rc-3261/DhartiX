"""AI service layer for DhartiX.

If an AI_API_KEY is configured, requests are sent to an OpenAI-compatible chat
completions endpoint. Otherwise a local rule-based fallback generates helpful
responses from the crop knowledge base so the application always works.
"""

import json
import random

import requests
from django.conf import settings

# ---------------------------------------------------------------------------
# Crop knowledge base (used by the local fallback and as context for AI calls)
# ---------------------------------------------------------------------------

CROP_KNOWLEDGE = {
    'Rice': {
        'soils': ['ALLUVIAL', 'CLAY', 'LOAMY'],
        'seasons': ['Kharif', 'Monsoon'],
        'growing_period': '110-150 days',
        'water': 'High (flooded paddies)',
        'fertilizer': 'Balanced NPK, urea top-dressing at tillering',
        'temp_range': (20, 35),
    },
    'Wheat': {
        'soils': ['ALLUVIAL', 'LOAMY', 'CLAY'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '120-150 days',
        'water': 'Moderate (4-5 irrigations)',
        'fertilizer': 'NPK 120:60:40 with zinc application',
        'temp_range': (10, 25),
    },
    'Maize': {
        'soils': ['LOAMY', 'ALLUVIAL', 'SANDY'],
        'seasons': ['Kharif', 'Rabi', 'Monsoon'],
        'growing_period': '90-120 days',
        'water': 'Moderate (65-70% field capacity)',
        'fertilizer': 'High nitrogen, NPK 20:10:10 split dose',
        'temp_range': (18, 35),
    },
    'Sugarcane': {
        'soils': ['ALLUVIAL', 'BLACK', 'LOAMY'],
        'seasons': ['Any'],
        'growing_period': '10-14 months',
        'water': 'High (every 7-10 days)',
        'fertilizer': 'NPK 250:60:60 with organic manure',
        'temp_range': (20, 40),
    },
    'Cotton': {
        'soils': ['BLACK', 'ALLUVIAL'],
        'seasons': ['Kharif', 'Monsoon'],
        'growing_period': '150-180 days',
        'water': 'Low-Moderate (drought tolerant)',
        'fertilizer': 'Balanced NPK, avoid excess nitrogen',
        'temp_range': (21, 35),
    },
    'Tomato': {
        'soils': ['LOAMY', 'SANDY', 'ALLUVIAL'],
        'seasons': ['Rabi', 'Spring'],
        'growing_period': '70-90 days',
        'water': 'Moderate, drip irrigation preferred',
        'fertilizer': 'Phosphorus-rich base + potassium for fruiting',
        'temp_range': (18, 28),
    },
    'Potato': {
        'soils': ['SANDY', 'LOAMY'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '80-110 days',
        'water': 'Moderate (avoid waterlogging)',
        'fertilizer': 'Low nitrogen, high potassium',
        'temp_range': (15, 22),
    },
    'Onion': {
        'soils': ['SANDY', 'LOAMY', 'ALLUVIAL'],
        'seasons': ['Rabi', 'Kharif'],
        'growing_period': '90-120 days',
        'water': 'Moderate',
        'fertilizer': 'Sulfur-rich, NPK 80:50:60',
        'temp_range': (13, 25),
    },
    'Groundnut': {
        'soils': ['SANDY', 'LOAMY'],
        'seasons': ['Kharif', 'Monsoon'],
        'growing_period': '100-130 days',
        'water': 'Low-Moderate',
        'fertilizer': 'Low nitrogen, apply gypsum at pegging',
        'temp_range': (24, 35),
    },
    'Chickpea': {
        'soils': ['BLACK', 'LOAMY'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '90-110 days',
        'water': 'Low (rainfed mostly)',
        'fertilizer': 'Low nitrogen, phosphorus + seed treatment',
        'temp_range': (15, 30),
    },
    'Mustard': {
        'soils': ['ALLUVIAL', 'SANDY', 'LOAMY'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '90-120 days',
        'water': 'Low-Moderate',
        'fertilizer': 'Balanced NPK with sulfur',
        'temp_range': (10, 30),
    },
    'Chili': {
        'soils': ['LOAMY', 'ALLUVIAL'],
        'seasons': ['Kharif', 'Monsoon'],
        'growing_period': '120-150 days',
        'water': 'Moderate (avoid drought stress at flowering)',
        'fertilizer': 'Balanced NPK, avoid excess nitrogen',
        'temp_range': (18, 30),
    },
    'Ladyfinger': {
        'soils': ['LOAMY', 'ALLUVIAL'],
        'seasons': ['Kharif', 'Summer'],
        'growing_period': '55-70 days',
        'water': 'Moderate',
        'fertilizer': 'Organic manure + balanced NPK',
        'temp_range': (22, 35),
    },
    'Brinjal': {
        'soils': ['LOAMY', 'ALLUVIAL'],
        'seasons': ['Kharif', 'Rabi'],
        'growing_period': '120-150 days',
        'water': 'Moderate',
        'fertilizer': 'High organic matter + phosphorus',
        'temp_range': (18, 32),
    },
    'Cabbage': {
        'soils': ['LOAMY', 'ALLUVIAL'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '90-120 days',
        'water': 'Moderate-High',
        'fertilizer': 'Nitrogen-rich with boron',
        'temp_range': (15, 25),
    },
    'Cucumber': {
        'soils': ['SANDY', 'LOAMY'],
        'seasons': ['Summer', 'Spring'],
        'growing_period': '55-70 days',
        'water': 'High',
        'fertilizer': 'Balanced NPK, frequent light doses',
        'temp_range': (20, 35),
    },
    'Carrot': {
        'soils': ['SANDY', 'LOAMY', 'ALLUVIAL'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '80-100 days',
        'water': 'Moderate',
        'fertilizer': 'Low nitrogen, high potassium',
        'temp_range': (16, 22),
    },
    'Soybean': {
        'soils': ['BLACK', 'LOAMY'],
        'seasons': ['Kharif', 'Monsoon'],
        'growing_period': '90-110 days',
        'water': 'Moderate',
        'fertilizer': 'Low nitrogen, phosphorus + zinc',
        'temp_range': (20, 32),
    },
    'Sunflower': {
        'soils': ['LOAMY', 'ALLUVIAL'],
        'seasons': ['Rabi', 'Summer'],
        'growing_period': '85-100 days',
        'water': 'Moderate',
        'fertilizer': 'Phosphorus + potassium, avoid excess nitrogen',
        'temp_range': (18, 32),
    },
    'Banana': {
        'soils': ['ALLUVIAL', 'LOAMY'],
        'seasons': ['Any'],
        'growing_period': '10-12 months',
        'water': 'High (regular irrigation)',
        'fertilizer': 'High potassium, regular organic manure',
        'temp_range': (20, 35),
    },
    'Mango': {
        'soils': ['BLACK', 'LOAMY', 'SANDY'],
        'seasons': ['Any'],
        'growing_period': '3-5 years to fruit',
        'water': 'Low (young trees watered in summer)',
        'fertilizer': 'Organic manure + NPK before flowering',
        'temp_range': (24, 35),
    },
    'Spinach': {
        'soils': ['LOAMY', 'ALLUVIAL'],
        'seasons': ['Rabi', 'Winter'],
        'growing_period': '45-60 days',
        'water': 'High',
        'fertilizer': 'Nitrogen-rich organic compost',
        'temp_range': (15, 25),
    },
}

SOIL_LABELS = {
    'ALLUVIAL': 'Alluvial',
    'BLACK': 'Black (regur)',
    'RED': 'Red',
    'LATERITE': 'Laterite',
    'SANDY': 'Sandy',
    'CLAY': 'Clay',
    'LOAMY': 'Loamy',
    'SALINE': 'Saline',
}


def _status_from_soil_moisture(moisture):
    if moisture is None:
        return 'Moderate (no data)'
    if moisture < 20:
        return 'Very low - irrigation urgently recommended'
    if moisture < 35:
        return 'Low - irrigation recommended'
    if moisture <= 60:
        return 'Normal/adequate for most crops'
    if moisture <= 80:
        return 'High - reduce irrigation, check drainage'
    return 'Very high - waterlogging risk'


def _ai_request(system_prompt, user_prompt):
    """Call OpenAI-compatible chat API. Returns None on failure."""
    if not settings.AI_API_KEY:
        return None
    try:
        resp = requests.post(
            f"{settings.AI_BASE_URL}/chat/completions",
            headers={
                'Authorization': f'Bearer {settings.AI_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': settings.AI_MODEL,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt},
                ],
                'temperature': 0.4,
                'max_tokens': 800,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return data['choices'][0]['message']['content'].strip()
    except Exception:
        return None


def chat_response(user_message, context=None):
    """Return AI response text. Tries remote AI, falls back to local logic."""
    context = context or {}
    system_prompt = (
        "You are DhartiX Agri Assistant, a helpful agricultural advisor. "
        "Answer questions about crops, irrigation, fertilizers, soil health, pests and "
        "farming practices clearly and practically. Be informational and safe. "
        "Use the farm context provided when available."
    )
    ctx_summary = json.dumps(context, default=str)
    result = _ai_request(system_prompt, f"Farm context: {ctx_summary}\n\nFarmer question: {user_message}")
    if result:
        return result
    return _local_chat_response(user_message.lower(), context)


def _local_chat_response(question, context):
    soil = context.get('soil_type')
    moisture = context.get('soil_moisture')
    temperature = context.get('temperature')
    humidity = context.get('humidity')
    crop = context.get('crop')
    stage = context.get('crop_stage')

    soil_label = SOIL_LABELS.get(soil, soil or 'your')

    if 'crop should i grow' in question or 'suitable for my soil' in question or 'which crop' in question:
        rec = recommend_crops(context)
        return (
            f"Based on your soil ({soil_label}), temperature "
            f"({temperature if temperature else 'n/a'}C) and water availability, "
            f"here are my top suggestions for your soil:\n"
            f"{_format_crop_recommendations(rec)}\n\n"
            "Tip: choose crops matching your season and available irrigation."
        )

    if 'irrigat' in question or 'water' in question:
        status = _status_from_soil_moisture(moisture)
        return (
            f"Current soil moisture reading is {moisture}% ({status}).\n\n"
            "- Soil moisture below 35%: irrigate as soon as possible.\n"
            "- Moisture 35-60%: normal, monitor daily trends.\n"
            "- Above 80%: delay irrigation and improve drainage.\n\n"
            "Prefer drip irrigation to reduce water usage by 30-50% compared to flood irrigation."
        )

    if 'fertilizer' in question:
        crop_name = crop or 'your crop'
        info = CROP_KNOWLEDGE.get(crop_name)
        if info:
            return (
                f"For {crop_name} the common guidance is: {info['fertilizer']}.\n\n"
                "Always test your soil first and consult local agriculture officials "
                "before applying fertilizer; recommendations are general guidance only."
            )
        return (
            "For most crops use a balanced NPK fertilizer appropriate to the growth stage. "
            "Apply more nitrogen during vegetative growth, phosphorus at planting/rooting, "
            "and potassium during flowering/fruiting. Always follow label rates and consider "
            "organic manure for soil health."
        )

    if 'poor growth' in question or 'yellow' in question or 'not growing' in question:
        return (
            "Possible causes of poor crop growth:\n"
            "- Water stress (check soil moisture - ideal is 40-60% for most crops).\n"
            "- Nutrient deficiency (yellowing often means nitrogen or iron deficiency).\n"
            "- Pest or disease attack.\n"
            "- Soil compaction or poor drainage.\n\n"
            f"Your context: soil moisture {moisture}%, temperature {temperature}C, "
            f"humidity {humidity}%. Check the moisture level first and inspect leaves "
            "for pests. Contact a local extension officer with photos for an accurate diagnosis."
        )

    if 'low soil moisture' in question or 'moisture is low' in question:
        return (
            f"Your soil moisture is at {moisture}% which is low. Recommended actions:\n"
            "1. Irrigate now - target 40-60% moisture.\n"
            "2. Use mulch to reduce evaporation.\n"
            "3. Improve water retention by adding organic matter/compost.\n"
            "4. Consider drip irrigation for efficient water use."
        )

    if 'reduce water' in question or 'save water' in question:
        return (
            "Ways to reduce water usage:\n"
            "- Switch to drip irrigation (saves 30-50% water).\n"
            "- Irrigate early morning or late evening to reduce evaporation.\n"
            "- Use mulching to retain soil moisture.\n"
            "- Grow drought-tolerant crop varieties.\n"
            "- Monitor soil moisture sensors and irrigate only when needed."
        )

    if 'season' in question or 'when should i plant' in question:
        return (
            "Continent-wise general planting windows:\n"
            "- Kharif/Monsoon (Jun-Oct): Rice, maize, cotton, groundnut, soybean.\n"
            "- Rabi/Winter (Oct-Mar): Wheat, chickpea, mustard, potato, tomato.\n"
            "- Summer (Mar-Jun): Ladyfinger, cucumber, sunflower.\n\n"
            "Check your local weather and expected harvest date before planting."
        )

    if 'pest' in question or 'disease' in question:
        return (
            "Integrated pest management tips:\n"
            "1. Inspect crops regularly (weekly).\n"
            "2. Use neem-based products for common pests.\n"
            "3. Remove and destroy infected plants.\n"
            "4. Practice crop rotation to break pest cycles.\n"
            "5. Use chemical pesticides only as a last resort, following label instructions."
        )

    return (
        f"I can help you with crops, irrigation, fertilizers, soil health and pests. "
        f"Your farm context: soil {soil_label}, soil moisture {moisture}%, "
        f"temperature {temperature if temperature else 'n/a'}C, humidity {humidity}%. "
        f"Try asking: 'Which crop should I grow?' or 'When should I irrigate?'"
    )


def recommend_crops(context):
    """Rule-based crop recommendation."""
    soil = (context.get('soil_type') or '').upper()
    moisture = context.get('soil_moisture')
    humidity = context.get('humidity')
    temperature = context.get('temperature')
    water_avail = (context.get('available_water') or '').lower()
    season = (context.get('season') or '').lower()
    max_results = int(context.get('limit', 5))

    scored = []
    for name, info in CROP_KNOWLEDGE.items():
        score = 0
        reasons = []
        if soil and info['soils'] and soil in [s.upper() for s in info['soils']]:
            score += 3
            reasons.append(f'suited to {soil_label_of(soil)} soil')
        if temperature:
            tmin, tmax = info['temp_range']
            if tmin <= temperature <= tmax:
                score += 2
                reasons.append('temperature is within its ideal range')
            elif temperature < tmin:
                score -= 1
                reasons.append('may be too cool')
            else:
                score -= 1
                reasons.append('may be too hot')
        if season:
            season_terms = ','.join(s.lower() for s in info['seasons']).lower()
            if season in season_terms:
                score += 2
                reasons.append(f'a good match for the {season} season')
        if moisture is not None and name in ('Rice', 'Sugarcane', 'Banana', 'Cucumber', 'Spinach'):
            if moisture >= 50:
                score += 1
                reasons.append('high water crops suit your current moisture')
        if water_avail and 'high' in water_avail and 'low' in info['water'].lower():
            score -= 1
            reasons.append('needs less water than you have available')
        if water_avail and 'low' in water_avail and 'high' in info['water'].lower():
            score -= 2
            reasons.append('needs a lot of water which may not be available')
        scored.append((name, score, reasons, info))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [{'name': n, 'score': s, 'reasons': r, 'info': i} for n, s, r, i in scored[:max_results]]


def soil_label_of(soil):
    return SOIL_LABELS.get(soil.upper(), soil)


def _format_crop_recommendations(recs):
    lines = []
    for r in recs:
        lines.append(
            f"- {r['name']} (suitability {max(r['score'], 0)}/10): {', '.join(r['reasons']) or 'works as a general option'}.\n"
            f"  Growing period: {r['info']['growing_period']}, Water: {r['info']['water']}."
        )
    return '\n'.join(lines)


def crop_recommendation_service(context):
    """Returns structured recommendation response."""
    recs = recommend_crops(context)
    soil = context.get('soil_type')
    temperature = context.get('temperature')
    humidity = context.get('humidity')

    # Try the AI first for richer reasoning
    system_prompt = (
        "You are an agronomy advisor. Recommend crops based on soil type, soil moisture, "
        "temperature, humidity, location, season and water availability. Return a JSON array "
        "with fields: crop, reason, conditions, growing_period, water_requirement, fertilizer."
    )
    ai_text = _ai_request(system_prompt, json.dumps(context, default=str))
    if ai_text:
        try:
            import re
            match = re.search(r'\[.*\]', ai_text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                return {'recommendations': parsed, 'source': 'ai'}
        except Exception:
            pass

    payload = []
    for r in recs:
        payload.append({
            'crop': r['name'],
            'reason': ', '.join(r['reasons']) or 'suits your general conditions',
            'conditions': {
                'soil_types': r['info']['soils'],
                'temp_range': list(r['info']['temp_range']),
            },
            'growing_period': r['info']['growing_period'],
            'water_requirement': r['info']['water'],
            'fertilizer': r['info']['fertilizer'],
            'suitability_score': max(r['score'], 0),
        })
    return {'recommendations': payload, 'source': 'local'}


def fertilizer_recommendation_service(context):
    crop = context.get('crop')
    stage = (context.get('crop_stage') or '').upper()
    soil = context.get('soil_type')
    moisture = context.get('soil_moisture')
    nitrogen = context.get('nitrogen')
    phosphorus = context.get('phosphorus')
    potassium = context.get('potassium')

    soil_label = SOIL_LABELS.get((soil or '').upper(), soil or 'your soil')

    system_prompt = (
        "You are a fertilizer advisor. Suggest fertilizers for a crop given crop name, "
        "stage, soil info, moisture and any nutrient test values. Return JSON with fields: "
        "category, reason, guidance, warnings. Be informational and safe, never present "
        "instructions as guaranteed facts."
    )
    ai_text = _ai_request(system_prompt, json.dumps(context, default=str))
    if ai_text:
        try:
            import re
            match = re.search(r'\{.*\}', ai_text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                return {
                    'category': parsed.get('category', 'Balanced NPK'),
                    'reason': parsed.get('reason', ''),
                    'guidance': parsed.get('guidance', ''),
                    'warnings': parsed.get('warnings', ''),
                    'input': context,
                    'source': 'ai',
                }
        except Exception:
            pass

    info = CROP_KNOWLEDGE.get(crop)
    base_guidance = info['fertilizer'] if info else 'Balanced NPK fertilizer appropriate for the growth stage.'

    if stage in ('GERMINATION', 'SEEDLING'):
        category = 'Nitrogen-phosphorus starter'
        reason = 'Young plants need phosphorus for root development and nitrogen for early leaf growth.'
        guidance = 'Use a low-dose starter such as DAP side-dressed near the roots, avoiding direct contact.'
    elif stage in ('FLOWERING', 'FRUITING', 'MATURITY'):
        category = 'Potassium-rich formula'
        reason = 'Potassium supports flowering, fruit development and disease resistance at this stage.'
        guidance = 'Apply potassium (MOP) along with controlled phosphorus; reduce nitrogen to avoid vegetative growth.'
    elif stage == 'VEGETATIVE':
        category = 'Nitrogen-rich formula'
        reason = 'Vegetative growth requires good nitrogen supply for leaf and stem development.'
        guidance = 'Apply urea in split doses and support with organic compost.'
    else:
        category = 'Balanced NPK'
        reason = f'A balanced approach suits the current stage of your crop grown on {soil_label} soil.'
        guidance = base_guidance

    warnings = []
    if moisture is not None and moisture < 30:
        warnings.append('Soil moisture is low; irrigate before applying fertilizer to avoid root burn.')
    if moisture is not None and moisture > 80:
        warnings.append('High soil moisture/waterlogging may cause fertilizer leaching; improve drainage.')
    if nitrogen and phosphorus and potassium and nitrogen == 0 and phosphorus == 0 and potassium == 0:
        warnings.append('Nutrient values were provided as zero - verify the soil test report.')
    warnings.append('These are general guidance only - consult local agriculture officers for exact dosing.')

    return {
        'category': category,
        'reason': reason,
        'guidance': guidance,
        'warnings': warnings,
        'suggested_for': crop,
        'crop_stage': stage,
        'soil_type': soil,
        'source': 'local',
    }


def irrigation_recommendation_service(context):
    moisture = context.get('soil_moisture')
    temperature = context.get('temperature')
    crop = context.get('crop')
    last_irrigation = context.get('last_irrigation')

    if moisture is None:
        status = 'UNKNOWN'
        advice = 'No soil moisture data available. Install or check your moisture sensor.'
    elif moisture < 20:
        status = 'IRRIGATION_RECOMMENDED'
        advice = 'Critical dryness. Irrigate immediately, then apply mulch to retain moisture.'
    elif moisture < 35:
        status = 'IRRIGATION_RECOMMENDED'
        advice = 'Low moisture. Irrigate soon and monitor - target 40-60% moisture.'
    elif moisture <= 60:
        status = 'NORMAL'
        advice = 'Soil moisture is adequate. Continue monitoring; avoid over-irrigation.'
    elif moisture <= 80:
        status = 'HIGH_MOISTURE'
        advice = 'Moisture is high. Delay irrigation and ensure good drainage to prevent waterlogging.'
    else:
        status = 'HIGH_MOISTURE'
        advice = 'Very high moisture - waterlogging risk. Stop irrigation and improve drainage.'

    water_usage_estimate = None
    if temperature is not None and moisture is not None and moisture < 35:
        water_usage_estimate = round(3.5 + (max(temperature - 25, 0) * 0.15), 2)

    return {
        'current_soil_moisture': moisture,
        'irrigation_status': status,
        'status_label': {
            'NORMAL': 'Normal',
            'LOW_MOISTURE': 'Low Moisture',
            'IRRIGATION_RECOMMENDED': 'Irrigation Recommended',
            'HIGH_MOISTURE': 'High Moisture',
            'UNKNOWN': 'Unknown',
        }.get(status, status),
        'last_irrigation': last_irrigation or 'Not recorded',
        'recommended_irrigation': advice,
        'temperature': temperature,
        'crop': crop,
        'estimated_daily_water_mm': water_usage_estimate,
        'source': 'local',
    }