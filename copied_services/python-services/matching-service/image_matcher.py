import cv2
import numpy as np

class ImageMatcher:
    def __init__(self):
        # Initialiser l'algorithme ORB
        self.orb = cv2.ORB_create()
        # Initialiser le matcher FLANN (Fast Library for Approximate Nearest Neighbors)
        # Paramètres pour l'algorithme k-d tree (pour les descripteurs binaires comme ORB)
        FLANN_INDEX_LSH = 6
        index_params = dict(algorithm=FLANN_INDEX_LSH,
                            table_number=6,  # 12
                            key_size=12,     # 20
                            multi_probe_level=1) #2
        search_params = dict(checks=50)   # nombre de fois à vérifier pour la meilleure correspondance

        self.flann = cv2.FlannBasedMatcher(index_params, search_params)

    def find_and_compare_features(self, img1_path, img2_path):
        """
        Trouve les points clés et les descripteurs pour deux images et les compare.
        """
        img1 = cv2.imread(img1_path, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imread(img2_path, cv2.IMREAD_GRAYSCALE)

        if img1 is None:
            print(f"Erreur : Impossible de charger l'image 1 depuis {img1_path}")
            return None
        if img2 is None:
            print(f"Erreur : Impossible de charger l'image 2 depuis {img2_path}")
            return None

        # Trouver les points clés et les descripteurs avec ORB
        kp1, des1 = self.orb.detectAndCompute(img1, None)
        kp2, des2 = self.orb.detectAndCompute(img2, None)

        if des1 is None or des2 is None:
            print("Erreur : Pas de descripteurs trouvés pour une ou les deux images.")
            return []

        # Debugging: Print descriptor types and shapes
        print(f"des1 dtype: {des1.dtype}, shape: {des1.shape}")
        print(f"des2 dtype: {des2.dtype}, shape: {des2.shape}")

        # Comparer les descripteurs en utilisant le matcher FLANN
        matches = self.flann.knnMatch(des1, des2, k=2)

        # Appliquer le ratio test de Lowe pour les bonnes correspondances
        good_matches = []
        for pair in matches:
            # Assurez-vous qu'il y a au moins deux correspondances pour appliquer le ratio test
            if len(pair) == 2:
                m, n = pair
                if m.distance < 0.7 * n.distance:
                    good_matches.append(m)
        
        return good_matches

    def compare_with_database_images(self, user_image_path, database_image_paths):
        """
        Compare une image utilisateur avec plusieurs images d'une base de données.
        Retourne une liste des images de la base de données triées par nombre de correspondances.
        """
        results = []
        for db_img_path in database_image_paths:
            print(f"Comparaison de {user_image_path} avec {db_img_path}")
            good_matches = self.find_and_compare_features(user_image_path, db_img_path)
            if good_matches is not None:
                results.append((db_img_path, len(good_matches)))
        
        # Trier les résultats par nombre de correspondances (du plus grand au plus petit)
        results.sort(key=lambda x: x[1], reverse=True)
        return results

# Exemple d'utilisation (vous devrez adapter ceci à votre application)
if __name__ == "__main__":
    matcher = ImageMatcher()

    # Chemins d'images de test (à remplacer par vos chemins réels)
    # Pour tester, assurez-vous d'avoir des images dans ces chemins
    test_image_user = "public/uploads/user_image.jpeg"
    test_database_images = [
        "public/uploads/db_image1.jpeg",
        "public/uploads/db_image2.jpeg",
        "public/uploads/db_image3.jpeg",
    ]

    # TODO: Intégrer la logique pour récupérer les chemins d'images de votre base de données.
    # Pour l'exemple, nous utilisons des chemins statiques.

    # TODO: Intégrer la logique pour recevoir l'image téléchargée par l'utilisateur.
    # L'image utilisateur peut être un fichier temporaire ou un chemin de fichier.

    print("Effectuer la comparaison des images...")
    comparison_results = matcher.compare_with_database_images(test_image_user, test_database_images)

    print("\nRésultats de la comparaison (Chemin de l'image, Nombre de correspondances) :")
    for img_path, num_matches in comparison_results:
        print(f"- {img_path}: {num_matches} correspondances")

    if comparison_results:
        print(f"L'image la plus similaire est : {comparison_results[0][0]} avec {comparison_results[0][1]} correspondances.")
    else:
        print("Aucune correspondance trouvée ou aucune image à comparer.") 