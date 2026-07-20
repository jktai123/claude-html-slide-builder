document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Bind Select Helper values to text inputs
  const selectHelpers = document.querySelectorAll('.form-select-helper');
  selectHelpers.forEach(select => {
    select.addEventListener('change', () => {
      const targetId = select.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.value = select.value;
        select.selectedIndex = 0; // reset
      }
    });
  });

  /* ==========================================================================
     1. General Tab Navigation Logic (6 tabs now)
     ========================================================================== */
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update Active Tab Button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update Active Content Area
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        }
      });

      // Special handling when switching to Camera tab to ensure canvas is sized correctly
      if (targetTab === 'camera') {
        setTimeout(initCanvas, 50);
      }
      
      // Special handling when switching to Devotion tab to load prompts
      if (targetTab === 'devotion') {
        renderDevotionPrompts(currentDevotionCat, currentDevotionFilter);
      }

      // Special handling when switching to Search tab to load history
      if (targetTab === 'search') {
        renderSearchHistory();
      }
    });
  });

  /* ==========================================================================
     2. Copy to Clipboard Utility & Toast Notification
     ========================================================================== */
  const toast = document.getElementById('toast');

  function showToast(message) {
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  const copyButtons = document.querySelectorAll('.btn-copy');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const textToCopy = document.getElementById(targetId).innerText;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check"></i> 已複製！`;
        lucide.createIcons();
        btn.classList.add('btn-success');

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          lucide.createIcons();
          btn.classList.remove('btn-success');
        }, 2000);
      }).catch(err => {
        console.error('無法複製文字: ', err);
      });
    });
  });

  /* ==========================================================================
     3. Interactive Prompt Generators (Course Tab)
     ========================================================================== */
  const btnGenFormula = document.getElementById('btn-gen-formula');
  if (btnGenFormula) {
    btnGenFormula.addEventListener('click', () => {
      const target = document.getElementById('formula-target').value;
      const scene = document.getElementById('formula-scene').value;
      const action = document.getElementById('formula-action').value;
      const mood = document.getElementById('formula-mood').value;

      const promptText = `請把這張照片中的人物呈現【${target}】的狀態，放在【${scene}】，正在做【${action}】，整體氛圍是【${mood}】。畫面要自然、溫馨、有故事感，像真實生活照片。臉要保持原本人物的樣子。`;
      document.getElementById('preview-formula-text').innerText = promptText;
    });
  }

  const btnGenStyle = document.getElementById('btn-gen-style');
  if (btnGenStyle) {
    btnGenStyle.addEventListener('click', () => {
      const art = document.getElementById('style-art').value;
      const people = document.getElementById('style-people').value;
      const item = document.getElementById('style-item').value;
      const location = document.getElementById('style-location').value;

      const promptText = `請幫我畫一張【${art}】的圖片，畫面中有一位【${people}】帶著【${item}】在【${location}】。`;
      document.getElementById('preview-style-text').innerText = promptText;
    });
  }

  /* ==========================================================================
     3.2 ExplainThis ChatGPT Prompt Database (Category Tabs)
     ========================================================================== */
  const explainData = {
    interview: [
      { title: '尋求履歷的反饋', prompt: '這份 [職位] 的履歷，有哪邊可以寫更好? 請以專業面試官的角度，提出具體改進建議。接著以你提出的建議來改寫這段經歷，改寫時請維持列點的形式。[附上履歷]' },
      { title: '為履歷加上量化數據', prompt: '改寫以下履歷，為每一點加上量化的數據，改寫時請維持列點的形式。[附上履歷]' },
      { title: '為不同公司客製化撰寫履歷', prompt: '我今天要申請 [公司] 的 [職位]，改寫以下經歷，讓我能更符合 [公司] 的企業文化。[附上經歷]' },
      { title: '求職信 Cover Letter', prompt: '你扮演一名專業的求職信寫手。我會給你相關的資訊，你要確保用繁體中文撰寫一封完整的求職信，並且美化和改寫。面試公司：[公司]、面試職位：[職位]、強項：[填入你的強項]，如：[實際舉例]。' },
      { title: 'STAR 原則面試模擬', prompt: '你扮演一名專業行為面試專家。請根據 STAR（情境、任務、行動、結果）格式，為我面試 [公司] [職位] 時最常問的行為問題「[面試問題]」，以 [語言] 撰寫一個 3 分鐘的優秀模擬回答。' }
    ],
    career: [
      { title: '制定職涯發展策略', prompt: '我目前是 [當前職位]，我的短期目標是晉升為 [目標職位]，長期目標是 [長期目標]。請幫我規劃一份 3 年內的學習與成長藍圖，包含必備硬實力、軟實力及建議取得的證照。' },
      { title: '轉職評估與建議', prompt: '我目前從事 [目前行業/職位]，考慮轉職到 [目標行業/職位]。請幫我分析兩者的技能關聯性，有哪些是可以遷移的技能 (transferable skills)，以及我應該優先補齊哪些知識缺口？' },
      { title: '爭取加薪/升遷提案', prompt: '我想向主管爭取 [加薪或升遷]。在過去一年中，我達成了 [具體成就與貢獻]，請幫我撰寫一份簡短但有說服力的面談大綱，用數據證明我的價值，語氣要自信且專業。' }
    ],
    report: [
      { title: '精準專案週報', prompt: '請以 [語氣，如：嚴謹商務] 幫我撰寫本週工作成果匯報。本週進度：[進度]，遭遇問題：[問題與解決方案]，下週規劃：[目標]，請整理得條理分明。' },
      { title: '行業市場分析大綱', prompt: '請為 [行業，如：生成式AI] 行業的最新趨勢，規劃一份市場研究報告的大綱，包含市場現況、主要競爭對手、未來增長機會及潛在風險分析。' },
      { title: '商業企劃書基本架構', prompt: '我正在為一個名為 [專案/產品] 的創意撰寫商業計劃書 (Pitch Deck)，請幫我規劃這份簡報的核心頁數架構（預期為 10 頁），並列出每頁應呈現的重點內容。' }
    ],
    data: [
      { title: '長文章重點摘要', prompt: '請將以下長文提煉出 [數字] 個最重要的核心要點，並以列點方式呈現，字數要精簡但完整保留重要資訊：[貼上長文]' },
      { title: '資訊表格化整理', prompt: '請將以下凌亂的資訊整理成一個結構清晰的 markdown 表格，包含 [欄位1]、[欄位2]、[欄位3] 等欄位：[貼上資訊]' },
      { title: '文章切入角度發想', prompt: '產生 [數字] 個具有說服力和描述性的文章主題想法，主題為「[某個主題]」，並附上每個想法的簡短大綱。' },
      { title: '長逐字稿精靈', prompt: '你是一位內容情報分析專家。請閱讀以下影片逐字稿，提取其中所有的核心論點、具體操作建議與專有名詞解釋：[貼上逐字稿]' }
    ],
    develop: [
      { title: '程式碼偵錯與修正', prompt: '以下這段 [語言] 程式碼出現了 Bug，請幫我找出問題發生的位置與原因，並提供修正後且安全的程式碼：[貼上程式碼]' },
      { title: '程式碼重構與加註解', prompt: '請優化並重構以下 [語言] 程式碼，使其符合 clean code 與最優化效能，並在關鍵邏輯處補上繁體中文註解：[貼上程式碼]' },
      { title: '自動化單元測試編寫', prompt: '請為以下這段 [語言] 函數，編寫完整且包含各種極端情況 (edge cases) 的單元測試程式碼：[貼上程式碼]' },
      { title: 'SQL 查詢語句生成', prompt: '我有一個資料庫，包含 [資料表與欄位結構說明]，請幫我寫一個 SQL 語句來查詢 [期望達到的查詢目標]。' }
    ],
    learning: [
      { title: '費曼學習法解釋概念', prompt: '請用「費曼學習法」來向我解釋 [名詞/概念]，使用一個簡單的日常比喻，並假裝我是 10 歲的小孩，讓我能輕鬆聽懂。' },
      { title: '主題知識快速入門', prompt: '我想在最短時間內了解 [學門/主題] 的核心基礎。請為我規劃一條從零開始的學習路徑，並列出前 3 個必須掌握的核心原理。' },
      { title: '常見誤區解答', prompt: '在學習 [主題/技能] 時，初學者最容易犯的 5 個錯誤或誤區是什麼？我們該如何避免這些坑？' }
    ],
    english: [
      { title: '英文書信潤飾與修正', prompt: '請幫我檢查並修改以下英文郵件，修正 any grammar errors、spelling，並使其口吻顯得更 [口吻，如：專業有禮/商務得體]，同時提供修改前後的對照與解析：[貼上英文郵件]' },
      { title: '情境單字與片語整理', prompt: '我即將面臨 [情境，如：英文面試/出國自助旅行]，請幫我整理 10 個該情境下最常使用的實用單字與片語，並附上中文例句。' },
      { title: '同義詞替換美化', prompt: '在英文寫作中，我經常重複使用「[常重複字，如：think/nice/important]」這個單字，請提供 5 個適合在 [商務/學術] 寫作中替換的同義詞，並說明各自的細微語境差別。' }
    ],
    productivity: [
      { title: '撰寫專業離職信', prompt: '你扮演一名專業的離職信寫手，幫助我寫一封專業且友善的離職信。職位是 [職位]，公司是 [公司]，最後一天是 [日期]。因 [離職原因] 必須離職，可提供 [可以提供的協助] 協助交接。' },
      { title: '委婉拒絕信件撰寫', prompt: '請幫我撰寫一封郵件，委婉且客氣地拒絕 [對象] 的 [事件]，說明由於 [原因/排程衝突] 無法參與，但期待未來有機會合作。' },
      { title: '高效會議議程擬定', prompt: '我們即將召開關於 [主題] 的會議。請幫我擬定一份專業的會議議程大綱，包含時間分配、主要討論問題、報告人角色，以及預期的產出目標。' },
      { title: '工作進度匯報撰寫', prompt: '請以 [語氣，如：簡潔專業] 的語氣，幫我把以下這段零散的工作項目整理成給主管的週報/進度報告：[貼上工作清單]' }
    ],
    write: [
      { title: '文章潤飾與語意修飾', prompt: '請潤飾並美化以下這段文字，使其顯得更加 [語氣，如：生動有趣/商務專業/溫暖文青]，同時修正任何語意不順的地方：[貼上文字]' },
      { title: '故事/小說大綱創作', prompt: '請幫我創作一個以 [主角背景] 為主角，在 [故事設定] 下，圍繞 [核心衝突] 展開的 [風格，如：奇幻/懸疑] 故事大綱與角色設定。' },
      { title: '電子報/推廣信件擬定', prompt: '請為我們的 [產品/服務] 撰寫一封電子報推廣信件，目的是促使讀者 [行動，如：註冊/購買]，語氣要具有說服力且簡潔。' }
    ],
    social: [
      { title: 'FB/IG 推廣貼文', prompt: '請幫我為 [產品或活動] 撰寫適合在 [平台，如：IG/FB] 發布的行銷貼文。文風要 [風格，如：熱情洋溢/專業幽默]，包含Emoji與 [數字] 個熱門 hashtag。' },
      { title: 'Threads 爆款串文', prompt: '請幫我把關於 [主題] 的核心知識，寫成一組適合發布在 Threads 上的串文 (Thread)，每段不超過 100 字，總共 [數字] 則，第一則必須有極強的鉤子 (Hook)。' },
      { title: 'YouTube 腳本與標題發想', prompt: '我考慮製作一部關於 [影片主題] 的短影片，請幫我發想 3 個高點閱率的影片標題，並規劃一個 2 分鐘的影片節奏大綱。' }
    ],
    sales: [
      { title: '產品銷售說話術 (Pitch)', prompt: '請為 [產品/服務] 撰寫一段 30 秒的電梯演說 (Elevator Pitch)。目標受眾是 [目標客戶]，要能立即點出他們的痛點、我們如何解決，以及最吸引人的賣點。' },
      { title: '客戶拒絕話術應對', prompt: '當銷售 [產品/服務] 時，客戶如果提出「[常見反對意見，如：價格太貴/沒時間]」的質疑，我該如何以專業且不失禮的溝通技巧來回應並化解？' },
      { title: '冷門開發郵件 (Cold Email)', prompt: '請幫我撰寫一封向 [潛在合作夥伴公司] [職位] 開發業務合作的 Cold Email，開頭要精準，字數不要多，重點強調我們能帶給對方的 [利益或合作價值]。' }
    ],
    marketing: [
      { title: '社群推廣貼文撰寫', prompt: '請幫我為 [產品/服務] 撰寫 3 篇適合發布在 [平台，如：FB/IG] 的推廣貼文，每篇要包含吸睛標題、Emoji 以及推薦的 hashtag。' },
      { title: '品牌文案 Slogan 生成', prompt: '請為定位為 [定位與特色] 的 [品牌/產品名稱]，生成 [數字] 個簡短、有力量且好記的品牌標語 (Slogan)。' },
      { title: '行銷推廣企劃草案', prompt: '請為即將推出的 [新產品/活動] 擬定一份推廣企劃草案，包含目標受眾 (TA) 特徵、核心價值主張、宣傳渠道與時程規劃。' }
    ],
    product: [
      { title: 'PRD 產品需求文檔大綱', prompt: '請幫我擬定一份 [新產品/功能] 的 PRD (產品需求文檔) 大綱，包含產品目標、用戶故事 (User Stories)、功能範疇、成功衡量指標及發佈階段規劃。' },
      { title: '競品分析框架設計', prompt: '我們要對 [競品名稱] 進行競品分析。請幫我設計一個競品分析框架，列出應著重比較的維度（如：功能、定價、UIUX、推廣渠道等）並說明原因。' },
      { title: '用戶研究問卷設計', prompt: '請幫我為 [產品類別/目標用戶] 設計一份包含 10 個問題的用戶調研問卷，以了解他們在 [痛點/使用場景] 下的使用習慣與不滿意之處。' }
    ],
    hr: [
      { title: '職缺描述撰寫 (JD)', prompt: '請幫我撰寫一份 [職位] 的職缺描述 (Job Description)，包含工作職責、基本要求、加分條件以及我們公司的福利吸引力。公司特色是 [公司特色]。' },
      { title: '面試面試題庫設計', prompt: '請扮演專業 HR 招募經理。請針對 [職位] 職缺，設計 5 個行為面試問題 (Behavioral Questions) 以及各自的評分標準與預期答案特徵。' },
      { title: '錄取通知信件 (Offer Letter)', prompt: '請撰寫一封繁體中文的正式錄取通知郵件給 [候選人姓名]，恭喜他錄取我們的 [職位]。內容應包含報到日期 [日期]、薪資結構 [薪資說明] 及回覆期限。' }
    ],
    investment: [
      { title: '財報核心指標解讀', prompt: '對於非金融背景的投資人，當閱讀 [公司/股票名稱] 的財務報表時，最需要優先關注的 3 個核心財務指標（如：毛利率、EPS、自由現金流等）是什麼？請用通俗語言說明。' },
      { title: '投資策略優缺點分析', prompt: '請幫我詳細分析「[策略名稱，如：定期定額/價值投資/波段操作]」這套投資策略的運作邏輯、主要優勢、最大潛在風險，以及最適合哪種類型的投資人。' },
      { title: '宏觀經濟新聞解讀', prompt: '當看到「[經濟事件，如：聯準會宣佈降息一碼/通貨膨脹率CPI攀升]」這類新聞時，這對我的 [資產類別，如：台股/美債/房地產] 分別會帶來什麼長期或短期的影響？' }
    ],
    life: [
      { title: '客製化旅遊行程規劃', prompt: '請幫我規劃一份 [天數] 的 [地點] 自助旅行行程。我希望每天行程安排 [風格，如：輕鬆悠閒/充實緊湊]，交通方式是 [交通工具]，每天必去 [景點]。' },
      { title: '運動與健身飲食計畫', prompt: '我是一位 [性別]、體重 [數字] 公斤，希望能達到 [目標，如：增肌/減脂] 效果。請為我規劃一週的無氧與有氧運動菜單，以及對應的飲食建議。' },
      { title: '個人閱讀/書單推薦', prompt: '我想深入了解 [領域，如：理財/心靈成長]，請為我推薦 5 本必讀的經典書籍，並說明推薦的理由與每本書的核心收穫。' }
    ],
    fun: [
      { title: '派對/聚會破冰遊戲設計', prompt: '我們即將舉辦一場有 [數字] 個人參加的 [活動類型，如：公司尾牙/朋友聚會] 聚會。請幫我設計 3 個簡單好玩、不需要繁複道具的破冰互動遊戲。' },
      { title: '創意生日/節日賀詞', prompt: '我的 [關係，如：好朋友/同事] 即將過生日。他非常喜歡 [興趣/梗]，請幫我寫 3 個不同風格（如：幽默搞笑、溫馨感人、文青勵志）的生日祝賀詞。' },
      { title: '自製特色菜單推薦', prompt: '我家裡目前冰箱有 [食材1]、[食材2]、[食材3]，調味料有基本油鹽醬醋。請幫我設計 2 道簡單且能在 20 分鐘內上桌的家常菜食譜。' }
    ],
    roleplay: [
      { title: '科技業職涯導師', prompt: '你現在扮演一位擁有 20 年全球科技業主管經驗的資深職涯導師。請以溫和且具建設性的語氣，針對我目前面臨的挑戰提供指導：[貼上你的挑戰]' },
      { title: '英文口說對話夥伴', prompt: '你現在是我的英文口說練習夥伴。請用簡單日常的英文與我對話，每次回答不要超過 3 句話。對話時，如果我的英文有文法或用語錯誤，請在括號中糾正我。現在請開始第一句打招呼。' },
      { title: '簡報/演講教練', prompt: '你現在是專業演講與 TED 簡報教練。我將提供簡報主題「[主題]」與目標受眾「[受眾]」，請幫我設計一個引人入勝的開場白，並給出三個核心報告技巧。' }
    ]
  };

  // Render ExplainThis prompt cards
  const explainOutput = document.getElementById('explain-cards-output');
  const explainTabBtns = document.querySelectorAll('.explain-tab-btn');

  function renderExplainCards(category) {
    if (!explainOutput) return;
    
    explainOutput.innerHTML = '';
    let items = [];

    if (category === 'all') {
      Object.keys(explainData).forEach(key => {
        items = items.concat(explainData[key]);
      });
    } else {
      items = explainData[category] || [];
    }

    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'explain-card';
      card.style.animationDelay = `${idx * 0.015}s`;

      const highlightedPrompt = item.prompt.replace(/(\[[^\]]+\])/g, '<span class="prompt-var">$1</span>');

      card.innerHTML = `
        <div>
          <div class="explain-card-title">${item.title}</div>
          <div class="explain-card-prompt">${highlightedPrompt}</div>
        </div>
        <div class="explain-card-actions">
          <button class="btn-explain-copy" data-raw-prompt="${item.prompt.replace(/"/g, '&quot;')}">
            <i data-lucide="copy" style="width: 13px; height: 13px;"></i> 一鍵複製
          </button>
        </div>
      `;

      explainOutput.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    explainOutput.querySelectorAll('.explain-card').forEach(cardEl => {
      const copyBtn = cardEl.querySelector('.btn-explain-copy');
      const rawPrompt = copyBtn.getAttribute('data-raw-prompt');

      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTextContent(rawPrompt);
        showActionStatus(copyBtn, '✓ 已複製');
      });

      cardEl.addEventListener('click', () => {
        copyTextContent(rawPrompt);
        showActionStatus(copyBtn, '✓ 已複製');
      });
    });
  }

  explainTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      explainTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      renderExplainCards(cat);
    });
  });

  setTimeout(() => {
    renderExplainCards('all');
  }, 300);

  /* ==========================================================================
     3.5 World News Command Generator (Form 3)
     ========================================================================== */
  // Date operations for news generator
  const newsNow = new Date();
  const newsYesterday = new Date(newsNow.getTime() - 86400000);
  const formatDateYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const newsTodayStr = formatDateYMD(newsNow);
  const newsYdayStr = formatDateYMD(newsYesterday);

  // Reference table rows data
  const newsRefRows = [
    { need: '全方位懶人包', cmd: `總結最近 24 小時全球發生的大事，包含政治、科技與經濟各一則。`, desc: '適合每日晨間快速掌握最新動態' },
    { need: '特定領域追蹤', cmd: `搜尋過去 24 小時內與 Nvidia 或 OpenAI 相關的最新國際新聞。`, desc: '替換公司/人物名稱即可精準查詢' },
    { need: '多角度對比', cmd: `針對 [某國際事件]，請列出過去一天內路透社與美聯社的不同報導重點。`, desc: '比較媒體立場與敘事差異' },
    { need: '數據與股市', cmd: `過去 24 小時內，全球金融市場最顯著的變動與相關新聞為何？`, desc: '適合開盤前或盤後做宏觀研究' },
    { need: 'Google 搜尋', cmd: `world news after:${newsYdayStr}`, desc: '直接貼入 Google 搜尋列過濾舊聞' },
    { need: '指定媒體', cmd: `world news site:bbc.com after:${newsYdayStr}`, desc: '限定 BBC 官方報導的全球新聞' },
    { need: '排除雜訊', cmd: `world news -sports after:${newsYdayStr}`, desc: '去除體育相關或娛樂八卦報導' },
    { need: 'Google Trends', cmd: `Google Trends Global Real-time`, desc: '尋找 24h 內搜尋量爆升的熱議話題' }
  ];

  // Render news reference table
  const newsTableBody = document.querySelector('#news-ref-table tbody');
  if (newsTableBody) {
    newsRefRows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700;">${row.need}</td>
        <td class="news-table-cmd-cell" title="點擊直接複製">${row.cmd}</td>
        <td style="color: var(--text-muted); font-size: 0.9rem;">${row.desc}</td>
      `;
      tr.querySelector('.news-table-cmd-cell').addEventListener('click', () => {
        copyTextContent(row.cmd);
      });
      newsTableBody.appendChild(tr);
    });
  }

  // Highlight syntax helper
  function highlightNewsSyntax(str) {
    return str
      .replace(/after:\d{4}-\d{2}-\d{2}/g, m => `<strong>${m}</strong>`)
      .replace(/"[^"]+"/g, m => `<strong>${m}</strong>`)
      .replace(/site:\S+/g, m => `<strong>${m}</strong>`);
  }

  // Generate News Commands function
  function generateNews() {
    const cat = document.getElementById('news-category').value;
    const time = document.getElementById('news-timerange').value;
    const source = document.getElementById('news-source').value;
    const kw = document.getElementById('news-keyword').value.trim();
    const exclude = document.getElementById('news-exclude').value.trim();

    const catLabel = cat || '全球';
    const kwPart = kw ? `與「${kw}」相關的` : '';
    const excPart = exclude ? `（排除 ${exclude}）` : '';
    const srcLabel = source ? source.replace('site:', '').replace('.com', '') : '';
    const srcNote = srcLabel ? `，來源限定 ${srcLabel}` : '';

    const dateOp = source ? `${source} ` : '';
    const kwOp = kw ? `"${kw}" ` : '';
    const exOp = exclude ? exclude.split(/[\s,，]+/).map(e => `-${e}`).join(' ') + ' ' : '';
    const catOp = cat ? `${cat} ` : 'world news ';

    // Build commands array
    const newsCmdList = [
      {
        type: '💬 對話提示詞（推薦）',
        cmd: `請幫我整理過去${time}內${catLabel}最重要的 10 則${kwPart}頭條新聞${srcNote}${excPart}，並提供每則的一句摘要。`,
        desc: '直接對 AI 提問，最方便省力'
      },
      {
        type: '🔍 Google 搜尋指令',
        cmd: `${catOp}${kwOp}after:${newsYdayStr} ${dateOp}${exOp}`.trim(),
        desc: `貼入 Google 搜尋列，精確過濾 ${time}內的新聞`
      },
      {
        type: '📰 多角度分析提示',
        cmd: `針對過去${time}內${kwPart || '全球重要'}${catLabel}新聞，請分別整理：① 事件摘要 ② 各方立場 ③ 可能影響${excPart}。`,
        desc: '用於深度理解複雜國際事件脈絡'
      },
      {
        type: '📊 數據摘要提示',
        cmd: `過去${time}內，${catLabel}領域${kwPart}最重要的數字、統計或市場變動是什麼？請列出 3 個關鍵數據並說明其意義。`,
        desc: '快速掌握量化資訊與核心指標'
      },
      {
        type: '⚡ 速報格式提示',
        cmd: `以「速報」格式整理過去${time}的${catLabel}新聞${kwPart}，每則不超過 30 字，列出最多 15 則${excPart}。`,
        desc: '適合碎片時間極速瀏覽'
      },
      {
        type: '🌐 RSS / Trends 指令',
        cmd: `Google Trends Global Real-time — 搜尋 "${cat || 'world'} ${kw || 'news'}" 並篩選過去 24 小時 Breakout 話題`,
        desc: '用於發現社群最熱門的爆點話題'
      }
    ];

    const cardsOutput = document.getElementById('news-cards-output');
    if (!cardsOutput) return;
    
    cardsOutput.innerHTML = '';

    newsCmdList.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'news-cmd-card';
      card.style.animationDelay = `${idx * 0.05}s`;
      
      card.innerHTML = `
        <div>
          <div class="news-cmd-card-type">${c.type}</div>
          <div class="news-cmd-card-text">${highlightNewsSyntax(c.cmd)}</div>
          <div class="news-cmd-card-desc">${c.desc}</div>
        </div>
        <div class="news-cmd-btn-group">
          <button class="btn-news-action btn-copy-cmd" data-text="${c.cmd.replace(/"/g, '&quot;')}">
            <i data-lucide="copy" style="width:13px;height:13px;"></i> 複製
          </button>
          <button class="btn-news-action btn-copy-url" data-text="${c.cmd.replace(/"/g, '&quot;')}">
            <i data-lucide="link" style="width:13px;height:13px;"></i> URL
          </button>
          <button class="btn-news-action btn-news-chatgpt" data-text="${c.cmd.replace(/"/g, '&quot;')}">
            <i data-lucide="external-link" style="width:13px;height:13px;"></i> 前往 AI
          </button>
        </div>
      `;
      
      cardsOutput.appendChild(card);
    });

    // Re-initialize lucide icons inside generated cards
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Bind event listeners for actions on cards
    cardsOutput.querySelectorAll('.news-cmd-card').forEach(cardEl => {
      const btnCopy = cardEl.querySelector('.btn-copy-cmd');
      const btnUrl = cardEl.querySelector('.btn-copy-url');
      const btnChat = cardEl.querySelector('.btn-news-chatgpt');

      const cmdText = btnCopy.getAttribute('data-text');

      btnCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTextContent(cmdText);
        showActionStatus(btnCopy, '✓ 已複製');
      });

      btnUrl.addEventListener('click', (e) => {
        e.stopPropagation();
        const encoded = encodeURIComponent(cmdText);
        copyTextContent(encoded);
        showActionStatus(btnUrl, '✓ URL-safe');
      });

      btnChat.addEventListener('click', (e) => {
        e.stopPropagation();
        const encoded = encodeURIComponent(cmdText);
        let aiUrl = `https://chatgpt.com/?q=${encoded}`;
        const platform = document.getElementById('companion-platform')?.value;
        if (platform === 'gemini') {
          aiUrl = `https://gemini.google.com/`;
        } else if (platform === 'claude') {
          aiUrl = `https://claude.ai/`;
        }
        window.open(aiUrl, '_blank');
      });

      // Click card itself to copy main command
      cardEl.addEventListener('click', () => {
        copyTextContent(cmdText);
        showActionStatus(btnCopy, '✓ 已複製');
      });
    });
  }

  // Action status switcher
  function showActionStatus(btn, successText) {
    const origText = btn.innerHTML;
    btn.innerHTML = successText;
    btn.style.borderColor = '#10b981';
    btn.style.color = '#34d399';
    setTimeout(() => {
      btn.innerHTML = origText;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  }

  // Clipboard copy implementation with toast
  function copyTextContent(text) {
    navigator.clipboard.writeText(text).then(() => {
      showGlobalToast();
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showGlobalToast();
    });
  }

  function showGlobalToast() {
    const toast = document.getElementById('copy-toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }
  }

  // Bind trigger button for news generation
  const btnGenNews = document.getElementById('btn-gen-news');
  if (btnGenNews) {
    btnGenNews.addEventListener('click', generateNews);
  }

  // Pre-generate news on page load
  setTimeout(generateNews, 200);


  /* ==========================================================================
     4. AI Style Camera / Canvas Filter Simulator
     ========================================================================== */
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas?.getContext('2d');
  const refImage = document.getElementById('ref-image');
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('progress-bar');
  const btnProcess = document.getElementById('btn-process-image');
  
  let currentImageSrc = 'assets/hike_sample.jpg';
  let selectedStyle = 'popart'; 
  let isUploadedImage = false;
  let uploadedImageObj = null;

  function initCanvas() {
    if (!canvas || !ctx) return;
    
    const img = isUploadedImage ? uploadedImageObj : refImage;
    if (!img || !img.complete) {
      if (img) img.onload = () => initCanvas();
      return;
    }

    const maxDimension = 800;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    ctx.filter = 'none';
    ctx.drawImage(img, 0, 0, width, height);
  }

  const sampleCards = document.querySelectorAll('.sample-img-card');
  const fileInput = document.getElementById('camera-upload-input');

  sampleCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-src');
      
      if (src === 'upload') {
        fileInput.click();
      } else {
        sampleCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentImageSrc = src;
        isUploadedImage = false;
        refImage.src = src;
        refImage.onload = () => initCanvas();
      }
    });
  });

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          uploadedImageObj = new Image();
          uploadedImageObj.onload = () => {
            isUploadedImage = true;
            currentImageSrc = event.target.result;
            
            sampleCards.forEach(c => c.classList.remove('active'));
            const uploadCard = document.querySelector('[data-src="upload"]');
            if (uploadCard) uploadCard.classList.add('active');
            
            initCanvas();
          };
          uploadedImageObj.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const cameraStyleSelect = document.getElementById('camera-style-select');
  const styleBtns = document.querySelectorAll('.style-select-btn');

  styleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStyle = btn.getAttribute('data-style');
      if (cameraStyleSelect) cameraStyleSelect.selectedIndex = 0;
    });
  });

  if (cameraStyleSelect) {
    cameraStyleSelect.addEventListener('change', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      selectedStyle = cameraStyleSelect.value;
    });
  }

  if (btnProcess) {
    btnProcess.addEventListener('click', () => {
      loader.classList.add('active');
      progressBar.style.width = '0%';

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
          clearInterval(interval);
          applyStyleFilter(selectedStyle);
          setTimeout(() => {
            loader.classList.remove('active');
          }, 300);
        }
      }, 120); 
    });
  }

  function applyStyleFilter(style) {
    const img = isUploadedImage ? uploadedImageObj : refImage;
    if (!img || !ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.filter = 'none';
    ctx.clearRect(0, 0, w, h);

    if (style === 'popart') {
      try {
        const halfW = w / 2;
        const halfH = h / 2;
        const colorSchemes = [
          ['#ffff00', '#0000ff'], 
          ['#ff007f', '#ffff00'], 
          ['#38bdf8', '#ef4444'], 
          ['#10b981', '#0b0f19']  
        ];

        for (let i = 0; i < 4; i++) {
          const dx = (i % 2) * halfW;
          const dy = Math.floor(i / 2) * halfH;

          ctx.drawImage(img, dx, dy, halfW, halfH);

          const imgData = ctx.getImageData(dx, dy, halfW, halfH);
          const data = imgData.data;
          const bg = hexToRgb(colorSchemes[i][0]);
          const fg = hexToRgb(colorSchemes[i][1]);

          for (let j = 0; j < data.length; j += 4) {
            const r = data[j];
            const g = data[j+1];
            const b = data[j+2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            let factor = gray;
            if (gray < 100) factor = 0;
            else if (gray > 180) factor = 255;
            else factor = (gray - 100) * (255 / 80);

            const pct = factor / 255;
            data[j]   = fg.r + (bg.r - fg.r) * pct;
            data[j+1] = fg.g + (bg.g - fg.g) * pct;
            data[j+2] = fg.b + (bg.b - fg.b) * pct;
          }
          ctx.putImageData(imgData, dx, dy);

          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 4;
          ctx.strokeRect(dx, dy, halfW, halfH);
        }
      } catch (err) {
        ctx.filter = 'contrast(1.5) saturate(1.8)';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
      }
    } 
    else if (style === 'clay') {
      try {
        ctx.filter = 'saturate(1.5) contrast(1.15) brightness(1.05) blur(1.5px)';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let j = 0; j < data.length; j += 4) {
          data[j]   = Math.round(data[j] / 51) * 51;
          data[j+1] = Math.round(data[j+1] / 51) * 51;
          data[j+2] = Math.round(data[j+2] / 51) * 51;
        }
        ctx.putImageData(imgData, 0, 0);

        ctx.globalAlpha = 0.15;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalAlpha = 1.0;

        const gradient = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      } catch (err) {
        ctx.filter = 'saturate(1.4) contrast(1.1) blur(1.2px)';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
      }
    }
    else if (style === 'artnouveau') {
      ctx.filter = 'sepia(0.55) contrast(1.1) brightness(1.05) saturate(1.25)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      const padding = Math.min(w, h) * 0.05;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.strokeRect(padding / 2, padding / 2, w - padding, h - padding);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);

      drawArtNouveauCorner(ctx, padding, padding, 0); 
      drawArtNouveauCorner(ctx, w - padding, padding, Math.PI / 2); 
      drawArtNouveauCorner(ctx, padding, h - padding, -Math.PI / 2); 
      drawArtNouveauCorner(ctx, w - padding, h - padding, Math.PI); 

      ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
      ctx.fillRect(padding, h - padding - 36, w - padding * 2, 36);

      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${Math.max(12, Math.round(w * 0.03))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText('溪頭一日健行 • 藝術寫真', w / 2, h - padding - 12);
    } 
    else if (style === 'ukiyoe') {
      ctx.filter = 'contrast(1.3) saturate(1.2) sepia(0.3)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, w, h);

      const stampSize = Math.max(30, Math.round(w * 0.07));
      const sx = w - stampSize - 20;
      const sy = 20;
      
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx, sy, stampSize, stampSize);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 3, sy + 3, stampSize - 6, stampSize - 6);
      
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(stampSize * 0.5)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('美', sx + stampSize / 2, sy + stampSize / 1.45);
    } 
    else if (style === 'impressionism') {
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      const strokesCount = w * h * 0.08;
      const maxBrushSize = Math.max(8, w * 0.025);

      for (let k = 0; k < strokesCount; k++) {
        const rx = Math.floor(Math.random() * w);
        const ry = Math.floor(Math.random() * h);
        const idx = (ry * w + rx) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const a = data[idx+3] / 255;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.85})`;
        ctx.beginPath();
        const radiusX = Math.random() * maxBrushSize + 2;
        const radiusY = Math.random() * (maxBrushSize / 2) + 1;
        const angle = Math.random() * Math.PI;
        ctx.ellipse(rx, ry, radiusX, radiusY, angle, 0, 2 * Math.PI);
        ctx.fill();
      }
    } 
    else if (style === 'vintage') {
      ctx.filter = 'sepia(0.85) contrast(0.8) brightness(0.95)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const startX = Math.random() * w;
        const startY = Math.random() * h;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
          startX + Math.random() * 40 - 20, 
          startY + Math.random() * 100 - 50,
          startX + Math.random() * 60 - 30, 
          startY + Math.random() * 200 - 100
        );
        ctx.stroke();
      }
      
      const gradient = ctx.createRadialGradient(w/2, h/2, Math.min(w,h) * 0.4, w/2, h/2, Math.max(w,h) * 0.7);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    else if (['chibi', 'line', 'sticker', 'dietsticker'].includes(style)) {
      ctx.filter = 'saturate(1.4) contrast(1.1) brightness(1.02)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, w - 14, h - 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, w - 28, h - 28);
    }
    else if (['plushie', 'marshmallow', 'softanime', 'baby'].includes(style)) {
      ctx.filter = 'brightness(1.08) saturate(1.4) contrast(1.15)';
      ctx.drawImage(img, 0, 0, w, h);
      
      ctx.globalAlpha = 0.5;
      ctx.filter = 'blur(10px) brightness(1.2) saturate(1.2)';
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';

      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      
      ctx.fillStyle = '#bae6fd';
      const dots = [
        [20, 20], [w-20, 20], [20, h-20], [w-20, h-20],
        [w/2, 20], [w/2, h-20], [20, h/2], [w-20, h/2]
      ];
      dots.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 8, 0, 2*Math.PI);
        ctx.fill();
      });
    }
    else if (style === 'gummy') {
      ctx.filter = 'saturate(1.6) contrast(1.2) blur(0.5px)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      const grad = ctx.createRadialGradient(w * 0.25, h * 0.25, 5, w * 0.3, h * 0.3, w * 0.5);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    else if (['watercolor', 'picturebook'].includes(style)) {
      ctx.filter = 'contrast(0.85) saturate(0.95) brightness(1.02)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 50 + 15, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    else if (['flat', 'infographic', 'geometric'].includes(style)) {
      try {
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let j = 0; j < data.length; j += 4) {
          data[j]   = Math.round(data[j] / 85) * 85;
          data[j+1] = Math.round(data[j+1] / 85) * 85;
          data[j+2] = Math.round(data[j+2] / 85) * 85;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        ctx.filter = 'contrast(1.4) saturate(1.2)';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
      }
    }
    else if (['korean', 'doodle', 'monochrome', 'graffiti', 'chalkboard'].includes(style)) {
      try {
        ctx.filter = 'contrast(1.6) grayscale(1.0)';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const threshold = 120;
        for (let j = 0; j < data.length; j += 4) {
          const v = (data[j] + data[j+1] + data[j+2]) / 3;
          const color = v > threshold ? 255 : 0;
          data[j] = data[j+1] = data[j+2] = color;
        }
        ctx.putImageData(imgData, 0, 0);

        if (style === 'chalkboard') {
          const d = ctx.getImageData(0, 0, w, h).data;
          ctx.fillStyle = '#1e3a1e';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#ffffff';
          for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
              const idx = (y * w + x) * 4;
              if (d[idx] === 0) {
                ctx.fillRect(x, y, 1.5, 1.5);
              }
            }
          }
        }
      } catch (err) {
        ctx.filter = 'grayscale(1.0) contrast(1.5)';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
      }
    }
    else if (['retroanime', 'lightleak'].includes(style)) {
      ctx.filter = 'sepia(0.25) contrast(0.9) brightness(1.05) saturate(1.2)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      const gradient = ctx.createRadialGradient(w, h / 2, 10, w, h / 2, w * 0.8);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.15)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    else if (['cyberpunk', 'vaporwave'].includes(style)) {
      ctx.filter = 'contrast(1.2) brightness(0.9) saturate(1.4)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let j = 0; j < data.length; j += 4) {
        const gray = 0.299 * data[j] + 0.587 * data[j+1] + 0.114 * data[j+2];
        data[j]   = Math.max(0, Math.min(255, gray + 60));
        data[j+1] = Math.max(0, Math.min(255, gray - 50));
        data[j+2] = Math.max(0, Math.min(255, gray + 140));
      }
      ctx.putImageData(imgData, 0, 0);
    }
    else if (['collage', 'washitape'].includes(style)) {
      ctx.drawImage(img, 0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, h);
      ctx.moveTo(w, 0); ctx.lineTo(0, h);
      ctx.stroke();
    }
    else if (style === 'botanical') {
      ctx.filter = 'saturate(1.2) contrast(1.05) hue-rotate(15deg)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.beginPath();
      ctx.ellipse(35, 35, 20, 8, Math.PI / 4, 0, 2 * Math.PI);
      ctx.ellipse(w - 35, h - 35, 20, 8, -Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    else if (style === 'bread') {
      ctx.filter = 'sepia(0.35) contrast(1.1) brightness(0.96) saturate(1.35)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';
    }
    else if (['fashion', 'portrait', 'mascot', 'miniature', 'western', 'gamerender', 'socialfilter', 'poster'].includes(style)) {
      ctx.filter = 'contrast(1.15) brightness(1.02) saturate(1.22)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    }

    // Draw high-quality style watermark at bottom right
    try {
      ctx.save();
      const styleName = styleNameMap[style] || 'AI 變身';
      const text = `✨ AI 畫風：${styleName}`;
      
      ctx.font = 'bold 12px sans-serif';
      const textWidth = ctx.measureText(text).width;
      const rectWidth = textWidth + 30;
      
      // Draw semi-transparent dark glass background
      ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
      ctx.fillRect(w - rectWidth - 15, h - 45, rectWidth, 33);
      
      // Draw golden boundary stroke
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w - rectWidth - 15, h - 45, rectWidth, 33);
      
      // Draw golden typography text
      ctx.fillStyle = '#fbbf24'; 
      ctx.textAlign = 'right';
      ctx.fillText(text, w - 30, h - 24);
      ctx.restore();
    } catch (e) {
      console.warn("Watermark error:", e);
    }
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function drawArtNouveauCorner(ctx, cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(15, 5, 20, 30, 5, 35);
    ctx.bezierCurveTo(-10, 40, -25, 20, -10, 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(18, 12, 6, 3, Math.PI / 4, 0, 2 * Math.PI);
    ctx.ellipse(6, 28, 5, 2, -Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  const btnDownload = document.getElementById('btn-download-img');
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `ai-style-portrait-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  /* ==========================================================================
     5. Photo Wall Management (LocalStorage & Data Persistence)
     ========================================================================== */
  const photoWall = document.getElementById('photo-wall');
  const classPhotoCount = document.getElementById('class-photo-count');
  
  const defaultArtworks = [
    {
      id: 'default-1',
      uploader: '阿芬',
      prompt: '請把這張照片中的人物呈現【更快樂無憂】的狀態，放在【翠綠的溪頭森林步道中】，整體氛圍是【溫馨、陽光、有故事感】，臉要保持原本人物的樣子。',
      imageUrl: 'assets/pop_art_couple.jpg',
      styleName: '波普藝術',
      timestamp: '10分鐘前'
    },
    {
      id: 'default-2',
      uploader: '阿耀',
      prompt: '請幫我畫一張【新藝術風格】的圖片，畫面中有一位帶著笑容的紳士，在黃色蒸汽火車頭前。',
      imageUrl: 'assets/art_nouveau_train.jpg',
      styleName: '新藝術風格',
      timestamp: '25分鐘前'
    },
    {
      id: 'default-3',
      uploader: '美珠',
      prompt: '嬰兒時期的我，含著金湯匙出生，抓週照，舊相本質感，非常可愛的胖嘟嘟嬰兒。',
      imageUrl: 'assets/baby_gold_spoon.jpg',
      styleName: '時空穿越',
      timestamp: '38分鐘前'
    },
    {
      id: 'default-4',
      uploader: '黃子恬 Althea',
      prompt: '新一代美圖秀秀 - 不一樣的我！將人物轉化為數位插畫風格肖像畫。',
      imageUrl: 'assets/hike_sample.jpg',
      styleName: '數位插畫',
      timestamp: '1小時前'
    }
  ];

  function getArtworks() {
    const stored = localStorage.getItem('ai_class_artworks');
    if (!stored) {
      localStorage.setItem('ai_class_artworks', JSON.stringify(defaultArtworks));
      return defaultArtworks;
    }
    return JSON.parse(stored);
  }

  function saveArtwork(artwork) {
    const list = getArtworks();
    list.unshift(artwork);
    localStorage.setItem('ai_class_artworks', JSON.stringify(list));
    renderPhotoWall();
  }

  function renderPhotoWall() {
    if (!photoWall) return;

    const list = getArtworks();
    photoWall.innerHTML = '';
    
    if (classPhotoCount) {
      classPhotoCount.innerText = list.length;
    }

    list.forEach(art => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      const firstLetter = art.uploader ? art.uploader.charAt(0) : 'A';

      card.innerHTML = `
        <div class="photo-card-img-wrapper">
          <img src="${art.imageUrl}" alt="${art.uploader} 的作品">
          <span class="style-indicator">${art.styleName}</span>
        </div>
        <div class="photo-card-body">
          <div class="photo-card-header">
            <div class="uploader-info">
              <div class="uploader-avatar">${firstLetter}</div>
              <div>
                <div class="uploader-name">${art.uploader}</div>
                <div class="upload-time">${art.timestamp}</div>
              </div>
            </div>
          </div>
          <div class="prompt-bubble">
            ${art.prompt}
          </div>
        </div>
      `;
      photoWall.appendChild(card);
    });
  }

  const wallForm = document.getElementById('wall-upload-form');
  const wallFileInput = document.getElementById('wall-file-input');
  const fileChosenText = document.getElementById('file-chosen-text');
  const thumbWrapper = document.getElementById('thumb-wrapper');
  const uploadThumbnail = document.getElementById('upload-thumbnail');
  
  let manualUploadBase64 = '';

  if (wallFileInput) {
    wallFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileChosenText.innerText = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
          manualUploadBase64 = event.target.result;
          uploadThumbnail.src = manualUploadBase64;
          thumbWrapper.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        fileChosenText.innerText = '尚未選擇檔案';
        thumbWrapper.style.display = 'none';
        manualUploadBase64 = '';
      }
    });
  }

  if (wallForm) {
    wallForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('uploader-name').value.trim();
      const prompt = document.getElementById('uploader-prompt').value.trim();

      if (!manualUploadBase64) {
        alert('請先選擇上傳的作品相片檔案！');
        return;
      }

      const newArt = {
        id: 'user-' + Date.now(),
        uploader: name,
        prompt: prompt || 'AI 藝術創作',
        imageUrl: manualUploadBase64,
        styleName: '自主上傳',
        timestamp: '剛剛'
      };

      saveArtwork(newArt);

      wallForm.reset();
      fileChosenText.innerText = '尚未選擇檔案';
      thumbWrapper.style.display = 'none';
      manualUploadBase64 = '';

      const wallSection = document.getElementById('photo-wall');
      if (wallSection) {
        wallSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const btnClear = document.getElementById('btn-clear-storage');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('確定要將照片牆重設為預設作品嗎？這會清除您剛才上傳的內容。')) {
        localStorage.removeItem('ai_class_artworks');
        renderPhotoWall();
      }
    });
  }

  const styleNameMap = {
    popart: '美式復古漫畫/普普藝術 (Pop Art)',
    artnouveau: '新藝術風格 (Art Nouveau)',
    clay: '3D 黏土/皮克斯風 (3D Clay/Pixar Style)',
    ukiyoe: '現代浮世繪 (Modern Ukiyo-e)',
    impressionism: '後印象派油畫 (Post-Impressionism)',
    vintage: '懷舊老照片',
    chibi: '1: 可愛 Q 版卡通人物插畫 / 貼紙風 (Chibi/Sticker style)',
    line: '2: 可愛Q版LINE貼圖風格 (Line sticker style)',
    plushie: '4: 療癒系毛絨娃娃 (Fluffy/Plushie Style)',
    chibi2: '5: 半寫實 Q 版插畫 (1.5–2頭身，精緻質感)',
    marshmallow: '6: 棉花糖空氣感 (Marshmallow Airbrush)',
    gummy: '7: Q彈果凍/軟糖風 (Gummy/Jelly Texture)',
    watercolor: '8: 溫暖手繪/水彩/蠟筆風 (Hand-Drawn & Healing)',
    picturebook: '9: 森林繪本風 (Picture Book Style)',
    baby: '10: 變裝寶寶風 (Baby Costume Style)',
    flat: '11: 扁平設計風 (Flat Design/Kurzgesagt)',
    infographic: '12: 扁平化資訊圖表風 (Flat Infographic)',
    korean: '13: 韓系極簡線條風 (Korean Minimalist)',
    doodle: '14: 隨手塗鴉日記風 (Doodle/Journal Style)',
    washitape: '15: 紙膠帶拼貼風 (Washi Tape/Scrapbook)',
    botanical: '16: 植栽花草共生風 (Botanical Buddy)',
    bread: '17: 剛出爐麵包色系 (Warm Bread Tones)',
    dietsticker: '18: 實體貼紙/白邊風 (Die-cut Sticker)',
    chibi3: '19: 半寫實 Q 版插畫 (2.5–3頭身，自然比例)',
    chalkboard: '20: 粉筆黑板畫 (Chalkboard Art)',
    retroanime: '21: 90 年代復古動漫風 (90s Retro Anime)',
    collage: '24: 拼貼藝術風格 (Collage/Mixed Media)',
    geometric: '25: 極簡幾何抽象 (Geometric Abstract)',
    cyberpunk: '26: 數位賽博龐克 (Cyberpunk/Neon)',
    vaporwave: '27: 迷幻蒸汽波 (Vaporwave)',
    lightleak: '28: 底片漏光感 (Film Light Leak Style)',
    portrait: '29: AI寫實人像插畫風 (AI Realistic Portrait)',
    mascot: '30: 角色IP品牌風 (Mascot Branding Style)',
    miniature: '31: 微縮模型場景 (Miniature Diorama)',
    stopmotionclay: '32: 童趣黏土動畫風 (Stop Motion Clay Style)',
    softanime: '33: 日系柔光戀愛風 (Soft Anime Romance)',
    western: '34: 歐美動畫劇場風 (Western Animation Style)',
    gamerender: '35: 遊戲角色建模風 (Game Character Render)',
    socialfilter: '36: 手機濾鏡美顏風 (Social Filter Style)',
    poster: '37: 插畫＋字體整合海報風 (Illustration Poster Style)',
    monochrome: '38: 黑白極簡漫畫風 (Monochrome Comic)',
    graffiti: '39: 塗鴉街頭藝術風 (Street Graffiti)',
    fashion: '40: 高級雜誌時尚插畫風 (Fashion Editorial Illustration)'
  };

  /* ==========================================================================
     6. Modal Publish Flow (From Camera Tab Directly to Wall)
     ========================================================================== */
  const publishModal = document.getElementById('publish-modal');
  const btnPublishTrigger = document.getElementById('btn-publish-wall-trigger');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');
  const modalPreviewImg = document.getElementById('modal-preview-img');
  
  if (btnPublishTrigger) {
    btnPublishTrigger.addEventListener('click', () => {
      const dataUrl = canvas.toDataURL();
      modalPreviewImg.src = dataUrl;

      const modalPromptInput = document.getElementById('modal-uploader-prompt');
      let curPrompt = '';
      if (selectedStyle !== 'vintage') {
        const styleName = styleNameMap[selectedStyle] || '指定風格';
        const people = document.getElementById('style-people').value.trim();
        const item = document.getElementById('style-item').value.trim();
        const location = document.getElementById('style-location').value.trim();
        curPrompt = `請幫我畫一張【${styleName}】的圖片，畫面中有一位【${people}】帶著【${item}】在【${location}】。`;
      } else {
        const target = document.getElementById('formula-target').value.trim();
        const scene = document.getElementById('formula-scene').value.trim();
        const action = document.getElementById('formula-action').value.trim();
        const mood = document.getElementById('formula-mood').value.trim();
        curPrompt = `請把這張照片中的人物呈現【${target}】的狀態，放在【${scene}】，正在做【${action}】，整體氛圍是【${mood}】。畫面要自然、溫馨、有故事感，像真實生活照片。臉要保持原本人物的樣子。`;
      }
      modalPromptInput.value = curPrompt;

      publishModal.classList.add('active');
    });
  }

  const closeModal = () => {
    publishModal?.classList.remove('active');
  };

  if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
  if (btnModalCancel) btnModalCancel.addEventListener('click', closeModal);

  if (btnModalConfirm) {
    btnModalConfirm.addEventListener('click', () => {
      const name = document.getElementById('modal-uploader-name').value.trim();
      const prompt = document.getElementById('modal-uploader-prompt').value.trim();

      if (!name) {
        alert('請輸入您的名字！');
        return;
      }

      let displayStyleName = styleNameMap[selectedStyle] || 'AI 變身';

      const newArt = {
        id: 'user-cam-' + Date.now(),
        uploader: name,
        prompt: prompt || 'AI 藝術創作',
        imageUrl: canvas.toDataURL(),
        styleName: displayStyleName,
        timestamp: '剛剛'
      };

      saveArtwork(newArt);
      closeModal();

      tabs.forEach(t => t.classList.remove('active'));
      const wallTabBtn = document.querySelector('[data-tab="wall"]');
      if (wallTabBtn) wallTabBtn.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === 'tab-wall') {
          content.classList.add('active');
        }
      });

      setTimeout(() => {
        const wallSection = document.getElementById('photo-wall');
        if (wallSection) {
          wallSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    });
  }


  /* ==========================================================================
     7. AI Devotion Companion Logic (Tab 5)
     ========================================================================== */
  const aiPlatforms = {
    gemini: { name: "Gemini", url: "https://gemini.google.com/app" },
    chatgpt: { name: "ChatGPT", url: "https://chatgpt.com" },
    claude: { name: "Claude", url: "https://claude.ai" },
    perplexity: { name: "Perplexity", url: "https://www.perplexity.ai" },
    grok: { name: "Grok", url: "https://grok.com" }
  };

  let currentAI = 'gemini';
  let currentDevotionCat = 'comfort';
  let currentDevotionFilter = 'all'; // For intercession dialect

  const devotionData = {
    comfort: [
      { title: "身體病痛時", text: "我今天身體很不舒服，心裡也很慌，請讀幾段醫治與平安的經文給我聽。" },
      { title: "自覺無用時", text: "我覺得老了身體沒用處了，心情很沮喪，請你跟我說一些鼓勵的話。" },
      { title: "痛到失眠時", text: "今晚我痛到睡不著，能不能陪我聊聊天，並用一段禱告結束？" },
      { title: "感到孤單時", text: "孩子們都很忙沒空回來，我一個人覺得很孤單，請跟我說說聖經裡關於神陪伴我們的故事。" },
      { title: "擔憂孫輩時", text: "我很擔心孫子的前途，心裡放不下，請給我一段能讓我放下焦慮的經文。" },
      { title: "想念老伴時", text: "我想念過世的老伴了，心裡酸酸的，請讀一段關於天家盼望的話給我聽。" },
      { title: "心靜不下來時", text: "我覺得最近生活壓力很大，心靜不下來，請帶領我做一個簡單的深呼吸靈修。" },
      { title: "迷惘未來時", text: "我對未來感到很迷惘，請告訴我神對我的生命還有什麼美好的計畫嗎？" },
      { title: "家中糾紛時", text: "請幫我寫一段簡短的禱告詞，求神賜給我智慧與耐心去面對家裡的糾紛。" },
      { title: "凡事謝恩時", text: "我今天覺得很有福氣，想感謝神，請陪我一起數算恩典，說說我們可以感謝神的事。" }
    ],
    scripture: [
      { title: "老年衰退 (詩71:9)", text: "讀詩篇 71:9 給我聽，並解釋神怎麼看我們老年的時候？" },
      { title: "家事忙碌 (馬大與馬利亞)", text: "我想聽馬大與馬利亞的故事，為什麼耶穌叫馬大不要忙了？" },
      { title: "教養孩童 (箴22:6)", text: "箴言22:6說教養孩童使他走當行的道，但我現在還能做什麼？" },
      { title: "明日憂慮 (太6:34)", text: "我不懂什麼是『一天的難處一天當』？耶穌在想什麼？" },
      { title: "愛的意義 (林前13)", text: "解釋哥林多前書13章的愛，對我們這種年紀的人有什麼新意義？" },
      { title: "死蔭幽谷 (詩23)", text: "解釋詩篇23篇的『死蔭幽谷』是什麼？神真的在那裡嗎？" },
      { title: "過去悔恨 (約一1:9)", text: "讀約翰一書1:9，我以前做錯的事，現在求神原諒還來得及嗎？" },
      { title: "常常喜樂 (帖前5:16)", text: "為什麼聖經說『要常常喜樂，不住禱告』？我病都沒好怎麼喜樂？" },
      { title: "生命末了 (提後4:7)", text: "解釋保羅說的『美好的仗我已經打過了』，這對我有什麼安慰？" },
      { title: "萬事互相效力 (羅8:28)", text: "羅馬書8:28說萬事互相效力，壞事也是嗎？" }
    ],
    intercession: [
      { type: "cn", title: "病友康復 (國語)", text: "幫我寫一段簡短的關懷短訊給王姊妹，她最近開完刀，求神醫治她，並祝她早日康復。" },
      { type: "cn", title: "痛失親人 (國語)", text: "林弟兄的老伴最近過世了，請幫我寫一段溫暖貼心的安慰短訊，告訴他我們都在為他代禱。" },
      { type: "cn", title: "子女工作 (國語)", text: "我孩子最近工作壓力大、很常加班。請寫一段溫柔的祝福禱告文，祝他出入平安、工作有智慧。" },
      { type: "cn", title: "家庭和睦 (國語)", text: "家裡最近有些爭執，請寫一個求神賜下平安與和睦的禱告文，讓我們能彼此包容。" },
      { type: "cn", title: "小組開場 (國語)", text: "幫我寫一段明天晚上小組聚會的開場禱告，語調要親切、熱情，歡迎新朋友。" },
      { type: "tw", title: "身體無爽快 (台語)", text: "王姊妹平安！聽講妳這幾日身體卡無爽快，我有替妳求主耶穌，保庇妳早日清氣、身體勇健。咱的神是咱隨時的幫助，妳要安心休養喔！" },
      { type: "tw", title: "心裡憂慮 (台語)", text: "老朋友，煩惱的事就交給主，嘸通自己擔。願主賜給妳平安的心，讓妳好睏、好眠。主耶穌惜妳，我也在遮替妳祈禱。" },
      { type: "tw", title: "感謝照顧 (台語)", text: "李姊妹，感謝妳送來的物件，誠好食！謝謝妳這款體貼。願主加倍賜福給妳全家，恩典滿滿喔！" },
      { type: "tw", title: "邀請聚會 (台語)", text: "這禮拜的小組聚會真精彩，大家攏真想妳。若有空作夥來坐，聽神的話，心情會變真好，等妳喔！" },
      { type: "tw", title: "囝仔做事業 (台語)", text: "乖兒，聽講你最近工作真無閒，壓力嘛大。阿母有替你祈禱，求主賜你智慧，出入攏平安，身體要顧好喔！" }
    ],
    prayerq: [
      { title: "為什麼神不聽我的病痛禱告？", text: "我每天都為了我的病痛迫切禱告，可是為什麼一直都沒有好轉？神真的有聽到我的聲音嗎？請用聖經的觀點安慰我。" },
      { title: "年紀大了，在教會還能做什麼？", text: "我現在年紀大了，體力不好，不像年輕人可以做那麼多服事。在神眼中，我還有什麼價值？我還能為教會做些什麼？" },
      { title: "面對死亡的陰影感到害怕...", text: "看到身邊同齡的朋友一個個離開，想到自己有天也要面對死亡，心裡總是有點害怕。請跟我說說聖經對天家的應許，讓我心裡有真正的平安。" },
      { title: "要怎麼原諒傷害過我的家人？", text: "過去家裡有些事讓我受過很大的傷害，心裡一直放不下。雖然知道聖經教我們要饒恕，但我該怎麼做才能真的放下心中的怨恨？" }
    ],
    gems: [
      { 
        title: "漫影煉金：二階段成語漫機", 
        text: "【核心定位】你是一位資深 AI 漫畫顧問，專門將成語轉化為具備 '現代諷刺感' 彩色漫畫。Phase 1：創意核准，接收成語後產出 3 個現代改編方案（A/B/C）。Phase 2：用戶確認後，輸出 4-6 格分鏡腳本並呼叫生圖。" 
      },
      { 
        title: "直播片頭背景圖 AI 專家", 
        text: "# 角色設定：基督教視覺傳達創意總監。任務：根據經文與主題產出「10 個視覺意象建議表」並包含 Unsplash 連結。第二階段：用戶輸入 [1-10] 觸發生成 16:9 cinematic 電影攝影風格無文字背景圖。" 
      },
      { 
        title: "每日靈修、全域財經科技報導", 
        text: "每日產出結構化簡報。包含：1) 心靈補給：基督教靈修心得。2) 全域財經：整理過去24小時全球、台灣財經新聞（事件、立場、影響）並附來源連結。3) AI科技趨勢新聞。" 
      },
      { 
        title: "個人 IP 圖像設計專家 (16宮格)", 
        text: "引導分析照片關鍵特徵。輸入 [1-18] 生成對應風格的 4x4 純白背景 IP 網格圖。輸入 [L+數字] 將原照片轉換為單張指定風格肖像。輸入 [p] 生成 4x3 職場表情網格圖。" 
      }
    ],
    setup: [
      { title: "讓你的 AI 助手稱呼你為『李大哥』", text: "請記得在接下來的對話中，一律稱呼我為『李大哥』，並且說話語調要親切、有耐心，多用溫暖的語氣來回答我的問題。" },
      { title: "要求回答簡單易懂、字體放大", text: "請把我當作一位 70 歲的長者，回答問題時請用簡單直白的話，不要用太多英文字或複雜的科技術語，段落要分明，字數不要太多。" }
    ]
  };

  // AI Selector buttons interaction
  const platformBtns = document.querySelectorAll('.platform-btn');
  platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      platformBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAI = btn.getAttribute('data-platform');
      
      // Re-render current category to update button labels
      renderDevotionPrompts(currentDevotionCat, currentDevotionFilter);
    });
  });

  // Category switch for devotion
  const devotionCatBtns = document.querySelectorAll('.devotion-nav-btn');
  devotionCatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      devotionCatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDevotionCat = btn.getAttribute('data-cat');

      // Show intercession sub-filter only for 'intercession' category
      const filterBar = document.getElementById('intercession-filter-bar');
      if (filterBar) {
        filterBar.style.display = (currentDevotionCat === 'intercession') ? 'flex' : 'none';
      }

      renderDevotionPrompts(currentDevotionCat, currentDevotionFilter);
    });
  });

  // Intercession dialect filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDevotionFilter = btn.getAttribute('data-filter');
      renderDevotionPrompts('intercession', currentDevotionFilter);
    });
  });

  // Render function for Devotion Tab cards
  function renderDevotionPrompts(category, filter = 'all') {
    const grid = document.getElementById('devotion-prompts-grid');
    if (!grid) return;

    grid.innerHTML = '';
    let dataList = devotionData[category] || [];

    // Filter intercession
    if (category === 'intercession' && filter !== 'all') {
      dataList = dataList.filter(item => item.type === filter);
    }

    if (dataList.length === 0) {
      grid.innerHTML = '<div class="card" style="grid-column: span 3; text-align:center; color:var(--text-muted);">無相關指令</div>';
      return;
    }

    dataList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'devotion-card';

      // Set badge style
      let tagClass = 'tag-normal';
      let tagLabel = category.toUpperCase();
      if (item.type === 'tw') { tagClass = 'tag-tw'; tagLabel = '台語口吻'; }
      else if (item.type === 'cn') { tagClass = 'tag-cn'; tagLabel = '國語口吻'; }
      else if (category === 'gems') { tagClass = 'tag-gems'; tagLabel = 'Gems'; }
      else if (category === 'comfort') tagLabel = '尋求安慰';
      else if (category === 'scripture') tagLabel = '經文解讀';
      else if (category === 'prayerq') tagLabel = '常見提問';
      else if (category === 'setup') tagLabel = '設定';

      const platformInfo = aiPlatforms[currentAI];

      card.innerHTML = `
        <div>
          <div class="devotion-card-header">
            <h3 class="devotion-card-title">${item.title}</h3>
            <span class="devotion-tag ${tagClass}">${tagLabel}</span>
          </div>
          <div class="devotion-prompt-text" id="prompt-txt-${category}-${cleanString(item.title)}">${item.text}</div>
        </div>
        <div class="devotion-card-actions">
          <button class="btn btn-primary btn-sm btn-copy-platform" data-text="${encodeURIComponent(item.text)}">
            <i data-lucide="copy"></i> 複製並前往 ${platformInfo.name}
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    // Re-bind click events for newly created devotion copy buttons
    bindDevotionCopyButtons();
    lucide.createIcons();
  }

  function cleanString(str) {
    return str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
  }

  function bindDevotionCopyButtons() {
    const copyPlatBtns = document.querySelectorAll('.btn-copy-platform');
    copyPlatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.getAttribute('data-text'));
        const platformInfo = aiPlatforms[currentAI];

        // Copy
        navigator.clipboard.writeText(text).then(() => {
          showToast(`指令已複製！即將前往 ${platformInfo.name}...`);
          
          // Open AI Platform in new tab after a brief delay
          setTimeout(() => {
            window.open(platformInfo.url, '_blank');
          }, 800);
        }).catch(err => {
          console.error('複製失敗: ', err);
        });
      });
    });
  }


  /* ==========================================================================
     8. Multi-Search Hub Logic (Tab 6)
     ========================================================================== */
  const searchUrls = {
    // AI Tools
    perplexity: { search: "https://www.perplexity.ai/?q=", home: "https://www.perplexity.ai" },
    colpilot: { search: "https://copilot.microsoft.com/?q=", home: "https://copilot.microsoft.com" },
    chatgpt: { search: "https://chatgpt.com/?q=", home: "https://chatgpt.com" },
    bard: { search: "https://gemini.google.com/app/search?q=", home: "https://gemini.google.com/app" },
    claude: { search: "https://claude.ai/new?q=", home: "https://claude.ai/new" },
    grok: { search: "https://grok.com/?q=", home: "https://grok.com" },
    deepseek: { search: "https://chat.deepseek.com/?q=", home: "https://chat.deepseek.com" },
    doubao: { search: "https://www.doubao.com/chat/?q=", home: "https://www.doubao.com" },
    felo_ai: { search: "https://felo.ai/search?q=", home: "https://felo.ai" },
    studio_global: { search: "https://app.studioglobal.ai/search?q=", home: "https://app.studioglobal.ai" },
    poe: { search: "https://poe.com/search?q=", home: "https://poe.com" },
    huggingface: { search: "https://huggingface.co/spaces/huggingface-projects/llama-2-13b-chat?q=", home: "https://huggingface.co" },
    notegpt: { search: "https://notegpt.io/search?q=", home: "https://notegpt.io" },
    google_ai_studio: { search: "https://aistudio.google.com/", home: "https://aistudio.google.com/" },
    max_ai: { search: "https://www.maxai.me/", home: "https://www.maxai.me/" },
    ChatGLM: { search: "https://chatglm.cn/main/gdetail/5f97977054f15d2a23ebccfa?q=", home: "https://chatglm.cn" },
    yiyan: { search: "https://yiyan.baidu.com/", home: "https://yiyan.baidu.com/" },
    kimi: { search: "https://kimi.moonshot.cn/", home: "https://kimi.moonshot.cn/" },
    NBklm: { search: "https://notebooklm.google.com/", home: "https://notebooklm.google.com/" },
    lovable: { search: "https://lovable.dev/", home: "https://lovable.dev/" },

    // Search Engines
    google: { search: "https://www.google.com/search?q=", home: "https://www.google.com" },
    bing: { search: "https://www.bing.com/search?q=", home: "https://www.bing.com" },
    duckduckgo: { search: "https://duckduckgo.com/?q=", home: "https://duckduckgo.com" },
    yahoo: { search: "https://tw.search.yahoo.com/search?p=", home: "https://tw.yahoo.com" },
    baidu: { search: "https://www.baidu.com/s?wd=", home: "https://www.baidu.com" },
    萌典: { search: "https://www.moedict.tw/", home: "https://www.moedict.tw" },
    找台語: { search: "https://chhoe.taigi.info/search.jsp?keyword=", home: "https://chhoe.taigi.info" },
    itaigi: { search: "https://itaigi.tw/k/", home: "https://itaigi.tw" },
    台語辭典: { search: "https://sutian.moe.edu.tw/und-hani/tshiau/?lui=tai_su&tsha=", home: "https://sutian.moe.edu.tw" },
    客語辭典: { search: "https://hakkadict.moe.edu.tw/search?q=", home: "https://hakkadict.moe.edu.tw" },

    // News
    udn: { search: "https://udn.com/search/word/2/", home: "https://udn.com" },
    chinatimes: { search: "https://www.chinatimes.com/search/", home: "https://www.chinatimes.com" },
    ltn: { search: "https://search.ltn.com.tw/list?keyword=", home: "https://search.ltn.com.tw" },
    ettoday: { search: "https://www.ettoday.net/news_search/doSearch.php?keywords=", home: "https://www.ettoday.net" },
    yahoo_news: { search: "https://tw.news.yahoo.com/search?p=", home: "https://tw.news.yahoo.com" },
    cna: { search: "https://www.cna.com.tw/search/hysearchws.aspx?q=", home: "https://www.cna.com.tw" },
    google_news: { search: "https://news.google.com/search?q=", home: "https://news.google.com" },

    // Images
    freepik: { search: "https://www.freepik.com/search?query=", home: "https://www.freepik.com" },
    Pexels: { search: "https://www.pexels.com/zh-tw/search/", home: "https://www.pexels.com" },
    Pixabay: { search: "https://pixabay.com/zh/images/search/", home: "https://pixabay.com" },
    Unsplash: { search: "https://unsplash.com/s/photos/", home: "https://unsplash.com" },
    FreeImages: { search: "https://www.freeimages.com/search/", home: "https://www.freeimages.com" },
    cc0_fengjing: { search: "https://cc0.cn/image/fengjing/", home: "https://cc0.cn/image/fengjing/" },
    NASA_APOD: { search: "https://apod.nasa.gov/apod/astropix.html", home: "https://apod.nasa.gov/apod/astropix.html" },
    wiki_daily: { search: "https://zh.m.wikipedia.org/zh-tw/Wikipedia:%E6%AF%8F%E6%97%A5%E5%9B%BE%E7%89%87", home: "https://zh.m.wikipedia.org/zh-tw/Wikipedia:%E6%AF%8F%E6%97%A5%E5%9B%BE%E7%89%87" },
    photo_ac: { search: "https://zh-tw.photo-ac.com/", home: "https://zh-tw.photo-ac.com/" },

    // Shopping
    momo: { search: "https://www.momoshop.com.tw/search/searchShop.jsp?keyword=", home: "https://www.momoshop.com.tw" },
    shopee: { search: "https://shopee.tw/search?keyword=", home: "https://shopee.tw" },
    pchome24: { search: "https://ecshweb.pchome.com.tw/search/v3.3/?q=", home: "https://shopping.pchome.com.tw" },
    yahoo_shop: { search: "https://tw.buy.yahoo.com/search/product?p=", home: "https://tw.buy.yahoo.com" },
    ruten: { search: "https://www.ruten.com.tw/find/?q=", home: "https://www.ruten.com.tw" },
    books: { search: "https://www.books.com.tw/web/sys_search?key=", home: "https://www.books.com.tw" },
    etmall: { search: "https://www.etmall.com.tw/Search?keyword=", home: "https://www.etmall.com.tw" },
    rakuten: { search: "https://www.rakuten.com.tw/search/", home: "https://www.rakuten.com.tw" },
    coupang: { search: "https://www.coupang.com.tw/search?q=", home: "https://www.coupang.com.tw" },
    fridays: { search: "https://shopping.friday.tw/ec2/search?sid=&hotKey=", home: "https://shopping.friday.tw" },
    鮮拾: { search: "https://www.10mart.com.tw/v2/Search?q=", home: "https://www.10mart.com.tw" },
    信源電器: { search: "https://www.xinyuan.com.tw/index.php?q=", home: "https://www.xinyuan.com.tw" },
    findprice: { search: "https://www.findprice.com.tw/g/", home: "https://www.findprice.com.tw" },
    priceTW: { search: "https://biggo.com.tw/s/?q=", home: "https://biggo.com.tw" },
    ezprice: { search: "https://feebee.com.tw/s/?q=", home: "https://feebee.com.tw" },
    sogi: { search: "https://www.sogi.com.tw/search?q=", home: "https://www.sogi.com.tw" },
    eprice: { search: "https://www.eprice.com.tw/search/?q=", home: "https://www.eprice.com.tw" },
    findbook: { search: "https://findbook.tw/search?q=", home: "https://findbook.tw" },
    funtime: { search: "https://www.funtime.com.tw/search.php?q=", home: "https://www.funtime.com.tw" },
    taiwango: { search: "https://www.taiwango.com.tw/search?q=", home: "https://www.taiwango.com.tw" },
    backpackers: { search: "https://www.backpackers.com.tw/forum/sitesearch.php?q=", home: "https://www.backpackers.com.tw" },
    agoda: { search: "https://www.agoda.com/zh-tw/search?asq=", home: "https://www.agoda.com" },
    booking: { search: "https://www.booking.com/searchresults.html?ss=", home: "https://www.booking.com" },
    trip: { search: "https://tw.trip.com/search/?keyword=", home: "https://tw.trip.com" },

    // Music
    Suno: { search: "https://suno.com/create", home: "https://suno.com" },
    Genape: { search: "https://app.genape.ai/chatApe", home: "https://app.genape.ai" },
    Aiva: { search: "https://creators.aiva.ai/", home: "https://creators.aiva.ai/" },
    Veedio: { search: "https://www.veed.io/", home: "https://www.veed.io/" },
    Napkin: { search: "https://app.napkin.ai/", home: "https://app.napkin.ai/" },

    // Art Gen
    Midjourney: { search: "https://www.midjourney.com", home: "https://www.midjourney.com" },
    BingArt: { search: "https://www.bing.com/images/create?q=", home: "https://www.bing.com/images/create" },
    ideogram: { search: "https://ideogram.ai/", home: "https://ideogram.ai/" },
    Recraft: { search: "https://www.recraft.ai/", home: "https://www.recraft.ai/" },
    klingai: { search: "https://klingai.com/", home: "https://klingai.com/" },
    dreamina: { search: "https://dreamina.capcut.com/", home: "https://dreamina.capcut.com/" },
    Leonardo: { search: "https://leonardo.ai/", home: "https://leonardo.ai/" },
    Raphael: { search: "https://artbreeder.com/", home: "https://artbreeder.com/" },
    Playground: { search: "https://playground.com/", home: "https://playground.com/" },
    Writesonic: { search: "https://writesonic.com/", home: "https://writesonic.com/" },
    Simplified: { search: "https://simplified.com/ai-image-generator/", home: "https://simplified.com" },
    LovoAI: { search: "https://lovo.ai/", home: "https://lovo.ai/" },
    Artguru: { search: "https://www.artguru.ai/", home: "https://www.artguru.ai/" },
    NightCafe_Creator: { search: "https://creator.nightcafe.studio/", home: "https://creator.nightcafe.studio/" },
    Magic_Studio: { search: "https://magicstudio.com/", home: "https://magicstudio.com/" },
    Craiyon: { search: "https://www.craiyon.com/?q=", home: "https://www.craiyon.com" },
    Hotpot_AI: { search: "https://hotpot.ai/", home: "https://hotpot.ai/" },
    DeepAI: { search: "https://deepai.org/machine-learning-model/text2img", home: "https://deepai.org" },
    Fotor: { search: "https://www.fotor.com/features/ai-image-generator/", home: "https://www.fotor.com" },
    OpenArt: { search: "https://openart.ai/", home: "https://openart.ai/" },
    Pixverse: { search: "https://pixverse.ai/", home: "https://pixverse.ai/" },
    clipdrop: { search: "https://clipdrop.co/", home: "https://clipdrop.co/" },
    photo_to_anime: { search: "https://www.imglarger.com/", home: "https://www.imglarger.com/" }
  };

  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const searchHistoryList = document.getElementById('search-history-list');
  const historySectionWrapper = document.getElementById('history-section-wrapper');

  // Load Search History from localStorage
  let searchHistory = JSON.parse(localStorage.getItem('gemini_search_history')) || [];

  // Toggle X clear button visibility
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      toggleClearButton();
    });
  }

  function toggleClearButton() {
    if (!searchClearBtn || !searchInput) return;
    searchClearBtn.style.display = (searchInput.value.trim().length > 0) ? 'flex' : 'none';
  }

  // Clear Input Box
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      toggleClearButton();
      searchInput.focus();
    });
  }

  // Handle Search Platform button clicks
  const searchButtons = document.querySelectorAll('.search-btn');
  searchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const engine = btn.getAttribute('data-engine');
      const config = searchUrls[engine];
      if (!config) return;

      const val = searchInput ? searchInput.value.trim() : '';

      if (val.length > 0) {
        // Save Search History
        addToHistory(val);
        
        // Copy text to clipboard for easy pasting
        copyTextContent(val);
        
        // Open search page
        window.open(config.search + encodeURIComponent(val), '_blank');
      } else {
        // Open homepage
        window.open(config.home, '_blank');
      }
    });
  });

  // Add items to history list
  function addToHistory(text) {
    // Filter duplicates
    searchHistory = searchHistory.filter(h => h.text !== text);
    searchHistory.unshift({
      text: text,
      time: Date.now()
    });

    // Cap at 15 items
    if (searchHistory.length > 15) {
      searchHistory.pop();
    }

    localStorage.setItem('gemini_search_history', JSON.stringify(searchHistory));
    renderSearchHistory();
  }

  // Render history list cards
  function renderSearchHistory() {
    if (!searchHistoryList || !historySectionWrapper) return;

    if (searchHistory.length === 0) {
      historySectionWrapper.style.display = 'none';
      return;
    }

    historySectionWrapper.style.display = 'block';
    searchHistoryList.innerHTML = '';

    searchHistory.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';

      historyItem.innerHTML = `
        <span class="history-text">${item.text}</span>
        <button class="history-del-btn" data-index="${index}"><i data-lucide="x"></i></button>
      `;

      // Click on text auto-populates search box
      historyItem.querySelector('.history-text').addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = item.text;
          toggleClearButton();
          searchInput.focus();
        }
      });

      // Click on X deletes single history
      historyItem.querySelector('.history-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(index);
      });

      searchHistoryList.appendChild(historyItem);
    });

    lucide.createIcons();
  }

  function deleteHistoryItem(index) {
    searchHistory.splice(index, 1);
    localStorage.setItem('gemini_search_history', JSON.stringify(searchHistory));
    renderSearchHistory();
  }

  // Clear all search history
  const btnClearHistory = document.getElementById('btn-clear-history');
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('確定要清空所有搜尋歷史紀錄嗎？')) {
        searchHistory = [];
        localStorage.removeItem('gemini_search_history');
        renderSearchHistory();
      }
    });
  }

  /* ==========================================================================
     8.5 30 Quick Prompts For Multi-Search (New)
     ========================================================================== */
  const quickPrompts = [
    // 生活旅遊 (8)
    { category: 'life', text: '規劃 [5] 天的 [日本東京] 自助旅行行程，步調要放慢，交通以大眾運輸為主。' },
    { category: 'life', text: '推薦 [南投溪頭] 適合 [60歲長者] 的 5 個必去私房景點與當地美食。' },
    { category: 'life', text: '我想在 [秋天] 去 [阿里山] 玩，請幫我規劃一份適合的攜帶物品與穿搭清單。' },
    { category: 'life', text: '介紹 [台南安平] 當地的特色歷史背景與必須體驗的在地文化。' },
    { category: 'life', text: '推薦 [牛肉麵] 在 [台北市] 最受歡迎的 3 家道地老店或口碑餐廳。' },
    { category: 'life', text: '推薦一條適合 [新手] 的 [陽明山] 週邊登山步道，包含路程與難度。' },
    { category: 'life', text: '在 [宜蘭] 遇到下雨天時，有哪些推薦的室內景點、博物館或文青咖啡廳？' },
    { category: 'life', text: '以台灣導遊身份，向外國旅客介紹 [九份老街] 最迷人的地方與背後故事。' },

    // 工作生產力 (8)
    { category: 'work', text: '請幫我草擬一封給主管的 [請假/專案延期] 報告信，語氣要簡潔有禮。' },
    { category: 'work', text: '針對 [第二季產品開發] 會議，請規劃一份包含主要討論問題與時間分配的議程大綱。' },
    { category: 'work', text: '我需要委婉拒絕 [合作夥伴] 的 [演講邀請]，請幫我寫一封商務拒絕郵件。' },
    { category: 'work', text: '請將以下零散的工作項目整理成給主管的週報/進度報告：[本週寫了三個介面、修了兩個Bug]' },
    { category: 'work', text: '請扮演行銷專家，為 [AI修圖軟體] 產生 3 個具有吸引力的社群推廣貼文標題。' },
    { category: 'work', text: '我需要向主管爭取 [升遷/加薪]，請幫我梳理出 3 個具說服力的談判要點。' },
    { category: 'work', text: '請為 [精品手工麵包店] 設計 3 個響亮、溫暖且好記的 brand slogan。' },
    { category: 'work', text: '請幫我撰寫一封向潛在合作夥伴開發商務聯名機會的 Cold Email，字數要精簡。' },

    // 寫作學習 (8)
    { category: 'learn', text: '請以費曼學習法向我解釋 [區塊鏈/量子力學]，用簡單的比喻，並假裝我是 10 歲小孩。' },
    { category: 'learn', text: '請幫我優化以下文字的語氣，使其更顯得 [溫暖文青/專業得體]：[貼上你的文字]' },
    { category: 'learn', text: '我想在最短時間內了解 [生成式AI] 的核心原理。請為我規劃一條從零開始的學習路徑。' },
    { category: 'learn', text: '在學習 [Python程式語言] 時，初學者最容易犯的 5 個核心誤區是什麼？' },
    { category: 'learn', text: '請推薦 3 本深入了解 [心理學/商業策略] 的必讀書籍，並說明推薦的理由與收穫。' },
    { category: 'learn', text: '請幫我將以下這段長文提煉出 3 個核心要點，並以條列式呈現：[貼上長文]' },
    { category: 'learn', text: '請幫我創作一個以 [退休警探] 為主角，在 [倫敦霧夜] 下展開的 [懸疑推理] 小說大綱。' },
    { category: 'learn', text: '請幫我檢查以下這段英文商務郵件的文法與用語，並給出修改建議：[貼上英文郵件]' },

    // 趣味創意 (6)
    { category: 'fun', text: '你現在是 20 年資歷的職涯導師，請解答我目前面臨的職場挑戰：[貼上挑戰]' },
    { category: 'fun', text: '請扮演我的英文口說練習夥伴，用日常英文與我對話，如果有文法錯誤請在括號內糾正我。' },
    { category: 'fun', text: '幫我為 [媽媽] 發想一個 [2000] 元以內、實用且有創意的生日禮物點子。' },
    { category: 'fun', text: '我家裡冰箱目前只有 [雞蛋] 和 [番茄]，請幫我設計兩道能在 15 分鐘內做好的創意菜。' },
    { category: 'fun', text: '設計 3 個適合 [8-10] 個人參加的室內家庭聚會破冰遊戲，不需要繁計的道具。' },
    { category: 'fun', text: '你現在是專門講冷笑話的 AI 助手，請給我講 3 個關於 [工程師/香蕉] 的冷笑話。' }
  ];

  const quickPromptsList = document.getElementById('quick-prompts-list');
  const quickPromptCategory = document.getElementById('quick-prompt-category');

  function renderQuickPrompts(category) {
    if (!quickPromptsList) return;
    quickPromptsList.innerHTML = '';

    const filtered = category === 'all' 
      ? quickPrompts 
      : quickPrompts.filter(p => p.category === category);

    filtered.forEach(item => {
      const tag = document.createElement('button');
      tag.className = 'quick-prompt-tag';
      tag.innerText = item.text;
      
      tag.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = item.text;
          searchInput.focus();
          
          if (searchClearBtn) {
            searchClearBtn.style.display = 'block';
          }
          
          showToast('💡 已填入！你可以直接在輸入框中進行修改編輯');
        }
      });

      quickPromptsList.appendChild(tag);
    });
  }

  if (quickPromptCategory) {
    quickPromptCategory.addEventListener('change', () => {
      renderQuickPrompts(quickPromptCategory.value);
    });
  }

  /* ==========================================================================
     9. Initialization & Load
     ========================================================================== */
  // Render Photo Wall on start
  renderPhotoWall();

  // Load default canvas after short delay
  setTimeout(initCanvas, 100);

  // Initialize search quick prompts
  renderQuickPrompts('all');
});
