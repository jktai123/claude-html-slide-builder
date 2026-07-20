import requests
from bs4 import BeautifulSoup
import re
import urllib.parse
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def test_multiple_topics():
    # 測試多個主題以驗證規則
    topics = [
        ("上癮", "/tc/%E4%B8%8A%E7%99%AE"),
        ("世界", "/tc/%E4%B8%96%E7%95%8C"),
        ("中保", "/tc/%E4%B8%AD%E4%BF%9D"),
        ("五旬節", "/tc/%E4%BA%94%E6%97%AC%E7%AF%80")
    ]
    
    for name, path in topics:
        url = f"https://dailyverses.net{path}"
        print(f"Testing {name} ({url})...")
        r = requests.get(url, headers=headers)
        if r.status_code != 200:
            print("  Failed to fetch")
            continue
            
        # 尋找 var images
        match = re.search(r'var\s+images\s*=\s*(\[[^\]]*\]);', r.text)
        if match:
            try:
                images_list = json.loads(match.group(1))
                print(f"  Found {len(images_list)} images via JS array:")
                for img in images_list[:3]:
                    print(f"    - https://dailyverses.net/images/tc/cuv/{img}")
            except Exception as e:
                print(f"  Error parsing JSON: {e}")
        else:
            print("  No var images found in JS!")
            # 看看有沒有其他 img
            soup = BeautifulSoup(r.text, 'html.parser')
            imgs = soup.find_all('img', class_='bibleVerseImage')
            print(f"  Found {len(imgs)} imgs with class bibleVerseImage")
            for img in imgs:
                print(f"    - https://dailyverses.net{img.get('src')}")

if __name__ == '__main__':
    test_multiple_topics()
