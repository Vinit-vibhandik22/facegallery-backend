from deepface.modules import verification
print("ArcFace cosine:", verification.find_threshold('ArcFace', 'cosine'))
print("Facenet512 cosine:", verification.find_threshold('Facenet512', 'cosine'))
