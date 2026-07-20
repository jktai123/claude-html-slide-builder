const fs = require('fs');
const path = require('path');
const https = require('https');
const { SaveGoogleSheet } = require('/Volumes/1T_HDD_2/Scrape/SaveGoogleSheet');

function getEnvVar(name) {
  const envPath = '/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.env';
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(`${name}=`)) {
        return line.split('=', 2)[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return process.env[name];
}

const NOTION_API_TOKEN = getEnvVar('NOTION_API_TOKEN');
if (!NOTION_API_TOKEN) {
  console.error('Error: NOTION_API_TOKEN is not set.');
  process.exit(1);
}

function callNotionAPI(endpoint, method, payload) {
  return new Promise((resolve, reject) => {
    const reqBody = JSON.stringify(payload);
    const options = {
      hostname: 'api.notion.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Notion API HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(reqBody);
    req.end();
  });
}

async function main() {
  const mdPath = '/Volumes/1T_HDD_2/Antigravity/20260530/html_files_summary.md';
  const docId = '18sT6CKuJzMPJnp4JDcOt3484rDVyj5YGh6IBLOB7S9I';
  const sname = 'HTML功能摘要';

  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} does not exist.`);
    process.exit(1);
  }

  console.log(`正在讀取並解析 ${mdPath}...`);
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');
  
  let currentRepo = '';
  const rows = [];
  const linkRegex = /\[(.*?)\]\((.*?)\)/;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('## 📁')) {
      currentRepo = line.replace('## 📁', '').trim();
      continue;
    }
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes(':---') || line.includes('檔案路徑') || line.includes('網頁標題')) {
        continue;
      }
      
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        const filePart = parts[1];
        const title = parts[2];
        const summary = parts[3];
        const related = parts[4];
        
        let filePath = filePart;
        let fileLink = '';
        
        const match = filePart.match(linkRegex);
        if (match) {
          filePath = match[1];
          fileLink = match[2];
        }
        
        rows.push({
          '專案': currentRepo,
          '檔案路徑': filePath,
          '網頁標題': title,
          '功能摘要': summary,
          '關聯資源': related,
          '檔案絕對路徑': fileLink
        });
      }
    }
  }

  console.log(`成功解析出 ${rows.length} 筆 HTML 檔案摘要。`);
  if (rows.length === 0) {
    console.error('Error: 未解析出任何資料。');
    process.exit(1);
  }

  // --- Upload to Google Sheet ---
  try {
    console.log(`正在上傳至 Google Sheet (ID: ${docId}, 工作表: ${sname})...`);
    await SaveGoogleSheet(docId, sname, rows);
    console.log('🎉 成功寫入 Google Sheet！');
    console.log(`🔗 Google Sheet 連結: https://docs.google.com/spreadsheets/d/${docId}/edit`);
  } catch (err) {
    console.error('Error: 上傳至 Google Sheet 失敗:', err);
  }

  // --- Upload to Notion ---
  console.log('正在向 Notion 創建頁面...');
  
  // Format today's date in Taipei time
  const tpeDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const todayStr = tpeDate.toISOString().split('T')[0];

  const properties = {
    "Title": {
      "title": [{"text": {"content": "GitHub HTML Files 功能與關聯摘要報告"}}]
    },
    "Date": {
      "date": {"start": todayStr}
    },
    "Summary": {
      "rich_text": [{"text": {"content": `整理三個 GitHub Pages 專案中各 HTML 檔案的功能與資源關聯。共計 ${rows.length} 個檔案。`}}]
    },
    "Category": {
      "select": {"name": "科技"}
    },
    "Importance": {
      "select": {"name": "中"}
    }
  };

  const blocks = [];
  blocks.push({
    "object": "block",
    "type": "heading_1",
    "heading_1": {"rich_text": [{"type": "text", "text": {"content": "GitHub HTML Files 功能與關聯摘要報告"}}]}
  });
  blocks.push({
    "object": "block",
    "type": "paragraph",
    "paragraph": {"rich_text": [{"type": "text", "text": {"content": `此報告詳細列出三個 GitHub Pages 專案中各 HTML 檔案的功能與資源關聯。共計 ${rows.length} 個檔案。`}}]}
  });

  // Group by repository
  const repoGroups = {};
  for (const row of rows) {
    if (!repoGroups[row.專案]) {
      repoGroups[row.專案] = [];
    }
    repoGroups[row.專案].push(row);
  }

  for (const repo in repoGroups) {
    blocks.push({
      "object": "block",
      "type": "heading_2",
      "heading_2": {"rich_text": [{"type": "text", "text": {"content": `📁 ${repo}`}}]}
    });

    for (const row of repoGroups[repo]) {
      blocks.push({
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
          "rich_text": [
            {
              "type": "text",
              "text": {"content": row.檔案路徑},
              "annotations": {"bold": true}
            },
            {
              "type": "text",
              "text": {"content": ` (${row.網頁標題}): ${row.功能摘要} [關聯資源: ${row.關聯資源}]`}
            }
          ]
        }
      });
    }
  }

  // Chunk blocks to avoid Notion block size limits (max 100 per request)
  const firstChunk = blocks.slice(0, 80);
  const remainingChunks = [];
  for (let i = 80; i < blocks.length; i += 80) {
    remainingChunks.push(blocks.slice(i, i + 80));
  }

  const payload = {
    "parent": {
      "database_id": "3285e6741c4d8084a436d6c081642c73"
    },
    "properties": properties,
    "children": firstChunk
  };

  try {
    const resData = await callNotionAPI('/v1/pages', 'POST', payload);
    const pageId = resData.id;
    const pageUrl = resData.url;
    console.log("Notion 頁面創建成功！");

    if (pageId && remainingChunks.length > 0) {
      for (let i = 0; i < remainingChunks.length; i++) {
        console.log(`正在向 Notion 追加第 ${i + 1} 批區塊 (共 ${remainingChunks[i].length} 個)...`);
        await callNotionAPI(`/v1/blocks/${pageId}/children`, 'PATCH', {
          "children": remainingChunks[i]
        });
      }
    }

    console.log("🎉 所有資料已成功上傳至 Notion！");
    console.log(`🔗 Notion 連結: ${pageUrl}`);
  } catch (err) {
    console.error("Error: 寫入 Notion 失敗:", err);
  }
}

main();
