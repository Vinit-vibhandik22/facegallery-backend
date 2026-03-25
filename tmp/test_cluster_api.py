import requests
import numpy as np

def cosine_dist(a, b):
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)
    return 1 - np.dot(a, b)

def test_clustering():
    url = "http://127.0.0.1:8000/cluster-faces"
    
    np.random.seed(42)
    # Scale=0.01 makes them much closer
    p1 = np.random.normal(0, 0.01, (3, 512)) + np.array([1] + [0]*511)
    p2 = np.random.normal(0, 0.01, (3, 512)) + np.array([0, 1] + [0]*510)
    p3 = np.random.normal(0, 0.01, (1, 512)) + np.array([-1] + [0]*511)
    
    embeddings = np.vstack([p1, p2, p3])
    
    # Print internal distances
    d12 = cosine_dist(p1[0], p1[1])
    d1_p2 = cosine_dist(p1[0], p2[0])
    print(f"Dist within Person 1: {d12:.6f}")
    print(f"Dist Person 1 to 2: {d1_p2:.6f}")

    embeddings_list = embeddings.tolist()
    
    try:
        response = requests.post(url, json=embeddings_list, params={"epsilon": 0.35, "linkage": "average"})
        if response.status_code == 200:
            data = response.json()
            print(f"Labels: {data['labels']}")
            print(f"Cluster Count: {data['clusterCount']}")
        else:
            print(f"FAILED: {response.status_code} {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_clustering()
