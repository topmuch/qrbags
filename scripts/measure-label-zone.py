#!/usr/bin/env python3
"""Détecte la zone blanche (emplacement QR) dans le design d'étiquette QRBag."""
from PIL import Image
import numpy as np

img = Image.open('/home/z/my-project/upload/ori2.png').convert('RGB')
w, h = img.size
print(f"Image: {w}x{h}px, ratio={w/h:.3f}")

# Cherche le plus grand rectangle quasi-blanc central
a = np.asarray(img)
white = (a > 218).all(axis=2)  # pixels quasi blancs (tolère les ombres légères)

# Scan des lignes/colonnes au centre
cx = w // 2
rows = np.where(white[:, cx-60:cx+60].mean(axis=1) > 0.85)[0]
cols = np.where(white[rows.min()+30:rows.max()-30, :].mean(axis=0) > 0.95)[0] if len(rows) else []

if len(rows) and len(cols):
    top, bottom = int(rows.min()), int(rows.max())
    left, right = int(cols.min()), int(cols.max())
    print(f"Zone blanche: x [{left}, {right}] → largeur {right-left}px ({(right-left)/w*100:.1f}%)")
    print(f"              y [{top}, {bottom}] → hauteur {bottom-top}px ({(bottom-top)/h*100:.1f}%)")
    print(f"Centre: ({(left+right)//2}, {(top+bottom)//2})")
    # En pourcentages (réutilisables à n'importe quelle résolution)
    print(f"\nPourcentages: left={left/w*100:.2f}% right={right/w*100:.2f}% top={top/h*100:.2f}% bottom={bottom/h*100:.2f}%")
    side = min(right-left, bottom-top)
    print(f"Côté max inscriptible: {side}px ({side/w*100:.1f}% de la largeur)")
else:
    print("Zone blanche non détectée — inspecter manuellement")
