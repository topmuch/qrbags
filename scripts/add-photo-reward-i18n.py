#!/usr/bin/env python3
"""Ajoute les clés i18n photo + récompense aux 3 locales (fr, en, ar)."""
import json

KEYS = {
    'fr': {
        'inscrire': {
            'photo_label': 'Photo de la valise',
            'photo_hint': 'Une photo aide à identifier votre bagage en cas de perte',
            'photo_camera': 'Prendre une photo',
            'photo_upload': 'Télécharger',
            'photo_change': 'Changer la photo',
            'photo_remove': 'Supprimer la photo',
            'photo_uploading': 'Envoi en cours...',
            'photo_error': "Échec de l'envoi de la photo",
            'reward_label': 'Récompense en cas de perte',
            'reward_hint': 'Motivez le retour rapide de votre bagage en proposant une récompense',
            'reward_placeholder': 'Ex : 50 000 FCFA',
        },
        'scan': {
            'photo_section': 'Photo du bagage',
            'reward_label': 'Récompense',
            'reward_desc': "Le propriétaire offre cette récompense à la personne qui lui rendra son bagage",
        },
    },
    'en': {
        'inscrire': {
            'photo_label': 'Luggage photo',
            'photo_hint': 'A photo helps identify your luggage if it gets lost',
            'photo_camera': 'Take a photo',
            'photo_upload': 'Upload',
            'photo_change': 'Change photo',
            'photo_remove': 'Remove photo',
            'photo_uploading': 'Uploading...',
            'photo_error': 'Photo upload failed',
            'reward_label': 'Lost & found reward',
            'reward_hint': 'Offer a reward to motivate a quick return of your luggage',
            'reward_placeholder': 'E.g.: 50,000 FCFA',
        },
        'scan': {
            'photo_section': 'Luggage photo',
            'reward_label': 'Reward',
            'reward_desc': 'The owner offers this reward to whoever returns the luggage',
        },
    },
    'ar': {
        'inscrire': {
            'photo_label': 'صورة الحقيبة',
            'photo_hint': 'الصورة تساعد في التعرف على حقيبتك في حالة فقدانها',
            'photo_camera': 'التقاط صورة',
            'photo_upload': 'تحميل',
            'photo_change': 'تغيير الصورة',
            'photo_remove': 'حذف الصورة',
            'photo_uploading': 'جارٍ الإرسال...',
            'photo_error': 'فشل إرسال الصورة',
            'reward_label': 'مكافأة عند الفقدان',
            'reward_hint': 'اعرض مكافأة لتحفيز إعادة حقيبتك بسرعة',
            'reward_placeholder': 'مثال: 50,000 فرنك',
        },
        'scan': {
            'photo_section': 'صورة الحقيبة',
            'reward_label': 'مكافأة',
            'reward_desc': 'يقدم المالك هذه المكافأة لمن يعيد له حقيبته',
        },
    },
}

for lang, namespaces in KEYS.items():
    path = f'/home/z/my-project/public/locales/{lang}.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    for ns, entries in namespaces.items():
        data.setdefault(ns, {})
        for k, v in entries.items():
            data[ns][k] = v
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'{lang}.json mis à jour (+{sum(len(v) for v in namespaces.values())} clés)')
