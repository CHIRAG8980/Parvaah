"""Pre-approved multilingual alert message templates for NER languages."""

# Supported languages in the North Eastern Region
SUPPORTED_LANGUAGES = ["en", "as", "bn", "mni", "kha", "lus", "hi"]

TEMPLATES: dict[str, dict[str, dict[str, str]]] = {
    "CRITICAL": {
        "title": {
            "en": "CRITICAL LANDSLIDE ALERT: Immediate Evacuation Advisory",
            "as": "গুৰুতৰ ভূমিস্খলনৰ সতৰ্কবাৰ্তা: তাৎক্ষণিক স্থানান্তৰৰ পৰামৰ্শ",
            "bn": "জরুরি ভূমিধস সতর্কতা: অবিলম্বে নিরাপদ স্থানে সরে যাওয়ার নির্দেশ",
            "mni": "লম লেইবা য়াম্না থোইরকপগী চেক্সিন্না ৱারোল: থুনা মফম হোংদোকউ",
            "kha": "KA JINGMAHUR BA KHRAW: Mih mardor sha ki jaka ba shngain",
            "lus": "LEILASO HLUAWHLUK HLUAWHNATHAWK: Hmun him lam pan nghal rawh",
            "hi": "अति गंभीर भूस्खलन चेतावनी: तत्काल सुरक्षित स्थान पर जाएं",
        },
        "action": {
            "en": "Evacuate lower slopes immediately. Cease travel on mountain highways.",
            "as": "ঢালু অঞ্চলৰ পৰা তৎকালীনভাৱে সুৰক্ষিত স্থানলৈ যাওক। পাহাৰীয়া পথত যাতায়ত বন্ধ ৰাখক।",
            "bn": "পাহাড়ের পাদদেশ অবিলম্বে ত্যাগ করুন। পাহাড়ি সড়কে সমস্ত চলাচল বন্ধ রাখুন।",
            "mni": "চিঙগী মখাদা লৈবা মীওইশিং মফম হোংদোকউ। লম্বীদা চৎপা লেপউ।",
            "kha": "Kylliang noh mardor na ki them riat. Sangeh ban iaid lynti.",
            "lus": "Tlang hnuai lam hmun atanga inthiarfihlim nghal tur. Kawngpui kal chuah tur.",
            "hi": "निचले ढलानों से तुरंत सुरक्षित स्थानों पर जाएं। पहाड़ी मार्गों पर यात्रा रोकें।",
        },
    },
    "HIGH": {
        "title": {
            "en": "HIGH LANDSLIDE WARNING: Prepare for Precautionary Measures",
            "as": "উচ্চ ভূমিস্খলনৰ সতৰ্কবাৰ্তা: সতৰ্কতামূলক ব্যৱস্থা গ্ৰহণ কৰক",
            "bn": "উচ্চ ভূমিধস সতর্কতা: সতর্কতামূলক ব্যবস্থা প্রস্তুত রাখুন",
            "mni": "লম লেইবগী চেক্সিন্না ৱারোল: চেক্সিন থৌরাং লৌখৎলু",
            "kha": "JINGMAHUR BA KHRAW: Pynkhreh ban iada",
            "lus": "LEILASO HLUAWHNA HLUAWHNA: Inbuatsaih rawh",
            "hi": "उच्च भूस्खलन चेतावनी: पूर्व-सतर्कता उपाय तैयार रखें",
        },
        "action": {
            "en": "Stay alert to ground cracks. Avoid non-essential road travel.",
            "as": "মাটিৰ ফাঁটৰ প্ৰতি দৃষ্টি ৰাখক। অপ্ৰয়োজনীয় ভ্ৰমণ পৰিহাৰ কৰক।",
            "bn": "মাটিতে ফাটল লক্ষ্য রাখুন। অপ্রয়োজনীয় সড়কযাত্রা এড়িয়ে চলুন।",
            "mni": "লৈফাক ৱাকপদা য়েংশিল্লু। মথৌ তাদনা খোঙচৎ চৎকনু।",
            "kha": "Peit bniah ia ki jingpait ka khyndew. Kiar na ka leit ka wan.",
            "lus": "Leikha kak te en uluk la. Tul lovah khualzin suh.",
            "hi": "जमीन में दरारों पर नजर रखें। अनावश्यक पहाड़ी यात्रा से बचें।",
        },
    },
}


def get_multilingual_alert(
    severity: str,
    zone_name: str,
    language: str = "en",
) -> tuple[str, str]:
    """Retrieve pre-translated title and action recommendation."""
    sev_key = severity.upper() if severity.upper() in TEMPLATES else "HIGH"
    lang_key = language.lower() if language.lower() in SUPPORTED_LANGUAGES else "en"

    title_tmpl = TEMPLATES[sev_key]["title"].get(
        lang_key, TEMPLATES[sev_key]["title"]["en"]
    )
    action_tmpl = TEMPLATES[sev_key]["action"].get(
        lang_key, TEMPLATES[sev_key]["action"]["en"]
    )

    formatted_title = f"{title_tmpl} - {zone_name}"
    return formatted_title, action_tmpl
