import requests
from bs4 import BeautifulSoup
import re
import urllib.parse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import os

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

BASE_URL = "https://dailyverses.net"

def get_topics():
    url = f"{BASE_URL}/tc/%E4%B8%BB%E9%A1%8C"
    print(f"Fetching main topics page: {url}")
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        print(f"Error fetching main page: {r.status_code}")
        return []
        
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # 找主題連結
    # 根據網頁結構，主題連結通常是包含在特定區塊，但我們可以用過濾 href 的方式
    exclude_texts = ["主題", "隨機聖經金句", "訂閱", "繁體中文Chinese (traditional)", "English", "Deutsch", "Español", "Português", "Français", "Italiano", "Nederlands", "Русский", "Polski", "Svenska", "Dansk", "Norsk", "Suomi", "Tagalog", "简体中文", "Tiếng Việt", "한국어", "日本語", "Indonesia", "Türkçe", "Română", "Українська", "Magyar", "Čeština", "Slovenčina", "Български", "Српски", "Ελληνικά"]
    
    topics = []
    # 尋找頁面中的主題連結。主題通常放在 class 為 column4 或是包含特定內容的 div 中
    # 我們可以直接抓 href 開頭為 /tc/ 且不是排除名單的
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.text.strip()
        
        # 只要是 /tc/... 且長度大於 4 (排除 "/tc", "/tc/") 且不是排除文字
        if href.startswith('/tc/') and text and text not in exclude_texts:
            # 排除特定的功能頁面
            if href in ['/tc', '/tc/', '/tc/%E4%B8%BB%E9%A1%8C', '/tc/%E9%9A%A8%E6%A9%9F%E8%81%96%E7%B6%93%E9%87%91%E5%8F%A5', '/tc/%E8%A8%82%E9%96%B1']:
                continue
            
            # 避免重複
            topic_url = f"{BASE_URL}{href}"
            if not any(t['url'] == topic_url for t in topics):
                topics.append({
                    'name': text,
                    'url': topic_url,
                    'path': href
                })
                
    print(f"Found {len(topics)} topics.")
    return topics

def scrape_single_topic(topic):
    name = topic['name']
    url = topic['url']
    
    try:
        # 稍作延遲避免頻率過高
        time.sleep(0.1)
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            return name, url, []
            
        # 尋找 javascript 中的 images 陣列
        match = re.search(r'var\s+images\s*=\s*(\[[^\]]*\]);', r.text)
        if match:
            images_list = json.loads(match.group(1))
            # 轉換為完整 URL
            full_urls = [f"{BASE_URL}/images/tc/cuv/{img}" for img in images_list]
            return name, url, full_urls
        else:
            # Fallback: 從網頁中直接找圖片
            soup = BeautifulSoup(r.text, 'html.parser')
            imgs = soup.find_all('img', class_='bibleVerseImage')
            if imgs:
                full_urls = []
                for img in imgs:
                    src = img.get('src')
                    if src:
                        # 移除 /s/ 縮圖路徑（如果有的話，雖然大圖可能本來就沒有 /s/）
                        src_clean = src.replace('/s/', '/')
                        full_urls.append(f"{BASE_URL}{src_clean}")
                return name, url, full_urls
                
            return name, url, []
    except Exception as e:
        print(f"Error scraping {name}: {e}")
        return name, url, []

def main():
    start_time = time.time()
    topics = get_topics()
    if not topics:
        print("No topics found. Exiting.")
        return
        
    results = []
    total = len(topics)
    print(f"Starting to scrape {total} topics using ThreadPool...")
    
    # 使用 12 個執行緒加快速度
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(scrape_single_topic, topic): topic for topic in topics}
        
        completed = 0
        for future in as_completed(futures):
            name, url, images = future.result()
            completed += 1
            if images:
                results.append({
                    "topic": name,
                    "url": url,
                    "images": images,
                    "count": len(images)
                })
                print(f"[{completed}/{total}] Scraped {name}: Found {len(images)} images.")
            else:
                print(f"[{completed}/{total}] Scraped {name}: No images found.")
                
    # 排序：依照主題名字排序，或者依照圖片數量排序
    results.sort(key=lambda x: x['topic'])
    
    output_data = {
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "total_topics": len(results),
        "total_images": sum(len(x['images']) for x in results),
        "data": results
    }
    
    # 輸出成 JSON 檔案
    output_file = "data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    elapsed = time.time() - start_time
    print(f"Finished. Saved {output_data['total_topics']} topics, {output_data['total_images']} total images to {output_file}.")
    print(f"Time elapsed: {elapsed:.2f} seconds.")

if __name__ == '__main__':
    main()
