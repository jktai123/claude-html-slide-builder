const fs = require('fs');
const https = require('https');
const { GoogleSpreadsheet } = require('/Volumes/1T_HDD_2/Scrape/node_modules/google-spreadsheet');

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
const creds = require('/Volumes/1T_HDD_2/Scrape/JKGoogleSheet.json');

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
  const docId = '18sT6CKuJzMPJnp4JDcOt3484rDVyj5YGh6IBLOB7S9I';
  const sname = 'HTML功能摘要';
  const pageId = '3a15e6741c4d8157a3a7f8d980977063';

  console.log('正在讀取 Google Sheet 資訊...');
  const doc = new GoogleSpreadsheet(docId);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  
  const sheet = doc.sheetsByTitle[sname];
  if (!sheet) {
    console.error(`Error: Worksheet ${sname} not found.`);
    process.exit(1);
  }
  
  const sheetId = sheet.sheetId;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${docId}/edit#gid=${sheetId}`;
  console.log(`取得的 Sheet URL: ${sheetUrl}`);

  console.log(`正在將此 URL 寫入 Notion Page (ID: ${pageId})...`);
  
  const payload = {
    "properties": {
      "URL": {
        "url": sheetUrl
      }
    }
  };

  try {
    const res = await callNotionAPI(`/v1/pages/${pageId}`, 'PATCH', payload);
    console.log('🎉 成功更新 Notion 頁面 URL 屬性！');
    console.log(`🔗 更新後的 Notion 連結: ${res.url}`);
  } catch (err) {
    console.error('Error: 更新 Notion 頁面失敗:', err);
    process.exit(1);
  }
}

main();
