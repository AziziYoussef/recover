# 🎯 RECOVR Detection Service

## Service de Détection d'Objets Perdus en Temps Réel

Ce service utilise tes modèles PyTorch pour détecter automatiquement les objets abandonnés via caméra et les envoyer vers ton backend Spring Boot.

## 🚀 Installation Rapide

### 1. Installer les dépendances Python
```bash
pip install -r requirements.txt
```

### 2. Vérifier tes modèles PyTorch
Assure-toi que tes modèles sont dans le répertoire parent :
```
lost-found-system/
├── stable_model_epoch_10.pth
├── stable_model_epoch_15.pth
├── stable_model_epoch_20.pth
├── stable_model_epoch_25.pth
├── stable_model_epoch_30.pth  ← Le service utilisera automatiquement le plus récent
└── detection-service/
```

### 3. Lancer le service
```bash
cd detection-service
python start_detection.py
```

## 🎥 Comment ça fonctionne

### 📸 **Détection Temps Réel**
1. **Caméra ouverte** → Le service capture le flux vidéo
2. **Analyse avec tes modèles PyTorch** → Détection d'objets frame par frame
3. **Tracking d'objets** → Suivi des objets détectés
4. **Logique d'abandon** → Si objet stationnaire > 10 secondes → ABANDONNÉ

### 🚨 **Quand un objet est détecté comme abandonné**
1. **Screenshot automatique** → Sauvegarde dans `snapshots/`
2. **Envoi vers API** → POST vers `http://localhost:8080/api/detection/process`
3. **Stockage en BDD** → Via ton backend Spring Boot
4. **Affichage sur ton site** → Visible sur http://localhost:3000

## 📊 **Interface Visuelle**

### Pendant la détection, tu verras :
- **🟦 Rectangle bleu** = Objet détecté
- **🟢 Rectangle vert** = Objet suivi (tracking)
- **🔴 Rectangle rouge** = Objet abandonné
- **Texte affiché** = Classe d'objet + temps de stagnation

### Commandes :
- **`q`** = Quitter le service
- **ESC** = Fermer la fenêtre

## 🔧 Configuration

Modifie `start_detection.py` pour ajuster :

```python
config = {
    'confidence_threshold': 0.6,        # Seuil de confiance (0.0-1.0)
    'abandon_threshold': 10,            # Secondes avant abandon (300 = 5min)
    'camera_location': 'Test Camera',   # Nom de la caméra
    'api_base_url': 'http://localhost:8080'  # URL de ton backend
}
```

## 📁 Structure des Fichiers

```
detection-service/
├── object_detector.py     # Service principal
├── start_detection.py     # Script de démarrage
├── requirements.txt       # Dépendances Python
├── snapshots/            # Screenshots automatiques
│   ├── TRACK_001_BAGS_20241209_143052.jpg
│   └── TRACK_002_ELECTRONICS_20241209_143105.jpg
└── README.md             # Ce fichier
```

## 🌐 Intégration avec ton Frontend

Une fois qu'un objet abandonné est détecté :

1. **API POST** → `/api/detection/process`
2. **Base de données** → Nouvelle entrée dans `detected_objects`
3. **Frontend Next.js** → Peut afficher via API GET `/api/detection/abandoned`

### Exemple de données envoyées :
```json
{
  "sessionId": "session_20241209_143052",
  "trackingId": "TRACK_001_BAGS",
  "category": "BAGS",
  "confidence": 0.89,
  "x": 120, "y": 200, "width": 80, "height": 100,
  "snapshotUrl": "/snapshots/TRACK_001_BAGS_20241209_143052.jpg"
}
```

## 🔍 Classes d'Objets Détectés

Le service peut détecter :
- 🎒 **BAGS** (sacs, valises)
- 📱 **ELECTRONICS** (téléphones, laptops)
- 👕 **CLOTHING** (vêtements)
- 🔑 **KEYS** (clés)
- 📄 **DOCUMENTS** (papiers)
- 💍 **JEWELRY** (bijoux)
- 📚 **BOOKS** (livres)
- 🧸 **TOYS** (jouets)
- 🎭 **ACCESSORIES** (accessoires)
- ❓ **MISCELLANEOUS** (autres)

## 🐛 Dépannage

### ❌ "No PyTorch models found"
- Vérifie que tes fichiers `.pth` sont dans le répertoire parent
- Nomme-les : `stable_model_epoch_XX.pth`

### ❌ "Could not open camera"
- Vérifie que ta caméra n'est pas utilisée par une autre app
- Essaie un autre index : `service.run_detection(camera_index=1)`

### ❌ "API request failed"
- Assure-toi que ton backend Spring Boot tourne sur port 8080
- Vérifie : `curl http://localhost:8080/api/detection/abandoned`

### ❌ "Missing dependency"
- Installe les dépendances : `pip install -r requirements.txt`
- Sur Ubuntu : `sudo apt install python3-opencv`

## 🎯 Exemple d'utilisation complète

```bash
# 1. Lancer le backend Spring Boot
cd spring-backend
./gradlew bootRun

# 2. Lancer le frontend Next.js  
cd ../
npm run dev

# 3. Lancer le service de détection
cd detection-service
python start_detection.py
```

**➡️ Ton système complet est maintenant opérationnel !** 🚀

Les objets abandonnés détectés par caméra apparaîtront automatiquement sur ton site web ! 🎉 