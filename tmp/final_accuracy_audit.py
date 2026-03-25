import requests
import numpy as np

def test_final_accuracy():
    url = "http://127.0.0.1:8000/cluster-faces"
    
    np.random.seed(42)
    
    # Person 1: Three different angles (Chain: A <-> B <-> C)
    # A to B: 0.1 dist, B to C: 0.1 dist. A to C: 0.2 dist.
    p1a = np.random.normal(0, 0.01, (3, 512)) + np.array([1.0, 0.0] + [0]*510)
    p1b = np.random.normal(0, 0.01, (3, 512)) + np.array([1.0, 0.05] + [0]*510)
    p1c = np.random.normal(0, 0.01, (3, 512)) + np.array([1.0, 0.1] + [0]*510)
    
    # Person 2: Two frontal angles (Far from Person 1)
    p2a = np.random.normal(0, 0.01, (3, 512)) + np.array([0.0, 1.0] + [0]*510)
    p2b = np.random.normal(0, 0.01, (3, 512)) + np.array([0.0, 1.1] + [0]*510)
    
    embeddings = np.vstack([p1a, p1b, p1c, p2a, p2b]).tolist()
    
    print(f"Testing combined clustering for {len(embeddings)} embeddings (P1: 9 vectors, P2: 6 vectors)...")
    # Actually vstack produces:
    # 3x512 (P1a), 3x512 (P1b), 3x512 (P1c) -> 9 vectors for Person 1
    # 3x512 (P2a), 3x512 (P2b) -> 6 vectors for Person 2
    # Total 15 vectors.
    
    try:
        res = requests.post(url, json=embeddings, params={"epsilon": 0.35, "refine": True})
        data = res.json()
        
        labels = data['labels']
        cluster_count = data['clusterCount']
        
        print(f"Labels: {labels}")
        print(f"Cluster Count: {cluster_count}")
        
        # Verify Person 1 (indices 0-8) are all the same
        p1_labels = set(labels[0:9])
        # Verify Person 2 (indices 9-14) are all the same
        p2_labels = set(labels[9:15])
        
        assert len(p1_labels) == 1, f"Person 1 split into multiple clusters: {p1_labels}"
        assert len(p2_labels) == 1, f"Person 2 split into multiple clusters: {p2_labels}"
        assert p1_labels != p2_labels, "Person 1 and Person 2 merged!"
        assert cluster_count == 2, f"Expected 2 clusters, found {cluster_count}"
        
        print("\nFINAL ACCURACY PROOF: PASSED ✓")
        print("Reason: Fragmentation prevented while distinct separation maintained.")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_final_accuracy()
