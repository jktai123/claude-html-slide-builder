import requests
from bs4 import BeautifulSoup
import re
import json
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

BASE_URL = "https://dailyverses.net"

def get_topics():
    url = f"{BASE_URL}/tc/%E4%B8%BB%E9%A1%8C"
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        return []
    soup = BeautifulSoup(r.text, 'html.parser')
    exclude_texts = ["主題", "隨機聖經金句", "訂閱", "繁體中文Chinese (traditional)", "English", "Deutsch", "Español", "Português", "Français", "Italiano", "Nederlands", "Русский", "Polski", "Svenska", "Dansk", "Norsk", "Suomi", "Tagalog", "简体中文", "Tiếng Việt", "한국어", "日本語", "Indonesia", "Türkçe", "Română", "Українська", "Magyar", "Čeština", "Slovenčina", "Български", "Српски", "Ελληνικά"]
    
    topics = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.text.strip()
        if href.startswith('/tc/') and text and text not in exclude_texts:
            if href in ['/tc', '/tc/', '/tc/%E4%B8%BB%E9%A1%8C', '/tc/%E9%9A%A8%E6%A9%9F%E8%81%96%E7%B6%93%E9%87%91%E5%8F%A5', '/tc/%E8%A8%82%E9%96%B1']:
                continue
            topic_url = f"{BASE_URL}{href}"
            if not any(t['url'] == topic_url for t in topics):
                topics.append({
                    'name': text,
                    'url': topic_url
                })
    return topics

def patch():
    try:
        with open("data.json", "r", encoding="utf-8") as f:
            db = json.load(f)
    except Exception as e:
        print(f"Error reading data.json: {e}")
        return

    # 獲取所有線上主題
    all_online_topics = get_topics()
    print(f"Total online topics: {len(all_online_topics)}")
    
    # 目前已有的主題名字
    existing_names = {item["topic"] for item in db["data"]}
    print(f"Total existing topics in JSON: {len(existing_names)}")
    
    # 排除非主題的干擾項
    non_topics = ["登入", "關於我", "聯絡", "私隱政策", "舊存檔案", "聖經書卷"]
    
    # 找出缺失的主題
    missing_topics = []
    for topic in all_online_topics:
        if topic["name"] not in existing_names and topic["name"] not in non_topics:
            missing_topics.append(topic)
            
    print(f"Found {len(missing_topics)} missing topics to patch: {[t['name'] for t in missing_topics]}")
    if not missing_topics:
        print("Nothing to patch.")
        return
        
    patched_count = 0
    new_items = []
    for item in missing_topics:
        name = item["name"]
        url = item["url"]
        print(f"Patching {name} ({url})...")
        
        success = False
        for attempt in range(3):
            try:
                time.sleep(1.5) # 延遲
                r = requests.get(url, headers=headers, timeout=15)
                if r.status_code == 200:
                    # 搜尋 JS array
                    match = re.search(r'var\s+images\s*=\s*(\[[^\]]*\]);', r.text)
                    if match:
                        images_list = json.loads(match.group(1))
                        full_urls = [f"{BASE_URL}/images/tc/cuv/{img}" for img in images_list]
                        if full_urls:
                            new_items.append({
                                "topic": name,
                                "url": url,
                                "images": full_urls,
                                "count": len(full_urls)
                            })
                            print(f"  Successfully patched {name}: Found {len(full_urls)} images.")
                            success = True
                            patched_count += 1
                            break
                    else:
                        # Fallback
                        soup = BeautifulSoup(r.text, 'html.parser')
                        imgs = soup.find_all('img', class_='bibleVerseImage')
                        if imgs:
                            full_urls = []
                            for img in imgs:
                                src = img.get('src')
                                if src:
                                    src_clean = src.replace('/s/', '/')
                                    full_urls.append(f"{BASE_URL}{src_clean}")
                            if full_urls:
                                new_items.append({
                                    "topic": name,
                                    "url": url,
                                    "images": full_urls,
                                    "count": len(full_urls)
                                })
                                print(f"  Successfully patched {name} (fallback): Found {len(full_urls)} images.")
                                success = True
                                patched_count += 1
                                break
                print(f"  Attempt {attempt+1} failed with status code {r.status_code}")
            except Exception as e:
                print(f"  Attempt {attempt+1} failed with exception: {e}")
                
        if not success:
            print(f"  Failed to patch {name} after 3 attempts.")

    # 合併並重新排序
    if new_items:
        db["data"].extend(new_items)
        db["data"].sort(key=lambda x: x['topic'])
        
    db["total_topics"] = len(db["data"])
    db["total_images"] = sum(len(x['images']) for x in db["data"])
    db["updated_at"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    
    # 寫回 data.json
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        
    print(f"Patching completed. Successfully patched {patched_count} topics. Total topics in JSON now: {db['total_topics']}, Total images now: {db['total_images']}.")

if __name__ == '__main__':
    patch()
