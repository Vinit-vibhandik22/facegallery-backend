from deepface.modules import verification
print('Facenet512 threshold metrics:')
for metric in ['cosine', 'euclidean', 'euclidean_l2']:
    try:
        print(f'{metric}: {verification.find_threshold("Facenet512", metric)}')
    except Exception as e:
        print(f'{metric}: ERROR {e}')
