#!/usr/bin/env python3
"""Ajoute les clés i18n tracking.baggage_photo + tracking.reward_promise (Task 7 — photo/reward sur /suivi)."""
import json

KEYS = {
    "baggage_photo": {
        "fr": "Photo du bagage",
        "en": "Luggage photo",
        "ar": "صورة الحقيبة",
    },
    "reward_promise": {
        "fr": "Récompense promise",
        "en": "Reward offered",
        "ar": "مكافأة معروضة",
    },
}

for loc in ["fr", "en", "ar"]:
    path = f"public/locales/{loc}.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    tracking = data.setdefault("tracking", {})
    for key, translations in KEYS.items():
        if key in tracking:
            print(f"  [{loc}] {key} déjà présent — conservé")
            continue
        tracking[key] = translations[loc]
        print(f"  [{loc}] +tracking.{key} = {translations[loc]}")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

print("OK — i18n tracking photo/reward ajouté (fr/en/ar)")
