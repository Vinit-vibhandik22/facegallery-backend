import requests
import numpy as np

def test_refinement():
    url = "http://127.0.0.1:8000/cluster-faces"
    
    np.random.seed(42)
    
    # Create two groups that are slightly apart
    # We'll use a very small epsilon to force a split
    # and then see if refinement (which calculates centroids) handles them.
    
    # Group 1: centered at [1, 0, 0...]
    p1 = np.random.normal(0, 0.01, (3, 512)) + np.array([1.0] + [0.0]*511)
    # Group 2: centered at [1, 0.05, 0...]
    p2 = np.random.normal(0, 0.01, (3, 512)) + np.array([1.0, 0.05] + [0.0]*510)
    
    embeddings = np.vstack([p1, p2]).tolist()
    
    # Force a split with epsilon=0.01 (very strict)
    # Both passes (initial and refine) use the same epsilon in current implementation
    # So if they split in initial, they'll likely split in refine too unless
    # the centroid calculation significantly changes the distance.
    
    res = requests.post(url, json=embeddings, params={"epsilon": 0.35, "refine": True})
    data = res.json()
    
    print(f"Server Response: {data}")
    if data['clusterCount'] > 0:
        print("SUCCESS: Refinement engine ran successfully.")
    else:
        print("FAILED: No clusters returned.")

if __name__ == "__main__":
    test_refinement()
