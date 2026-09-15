#!/bin/bash
# Régénère les 3 images hero de la page d'accueil avec des voyageurs noirs à l'aéroport
set -u
DIR="/home/z/my-project/public/images/landing-v2"

echo "[$(date +%H:%M:%S)] 1/3 hero-woman-traveler…"
z-ai image -p "Professional lifestyle photography of a beautiful young Black African woman traveler in a modern airport terminal, smiling confidently, pulling a stylish navy blue suitcase with a purple and orange QR code luggage tag attached, wearing an elegant orange headwrap and chic travel outfit, large glass windows with airplanes visible outside, warm golden natural light, cinematic depth of field, photorealistic, high quality, detailed" \
  -o "$DIR/hero-woman-traveler.png" -s 864x1152

echo "[$(date +%H:%M:%S)] 2/3 hero-man-scanning…"
z-ai image -p "Professional lifestyle photography of a smiling Black African man in a modern airport departure hall, scanning a QR code luggage tag on his navy suitcase with his smartphone, wearing a smart casual violet shirt, luggage trolley with bags beside him, departure boards and glass architecture in background, natural daylight, photorealistic, high quality, detailed" \
  -o "$DIR/hero-man-scanning.png" -s 864x1152

echo "[$(date +%H:%M:%S)] 3/3 hero-family-travel…"
z-ai image -p "Professional lifestyle photography of a happy Black African family at a modern airport, elegant mother and father walking with their two cheerful children, pulling colorful suitcases with QR code luggage tags, bright modern terminal with large windows and airplane visible, warm sunlight, joyful authentic moment, photorealistic, high quality, detailed" \
  -o "$DIR/hero-family-travel.png" -s 864x1152

echo "[$(date +%H:%M:%S)] Terminé."
ls -la "$DIR"/hero-*.png
