document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  /* ==========================================================================
     1. Tab Navigation Logic
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
    });
  });

  /* ==========================================================================
     2. Copy to Clipboard Utility
     ========================================================================== */
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
     3. Interactive Prompt Generators
     ========================================================================== */
  // Form 1: AI變身公式
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

  // Form 2: 公版畫風指令
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
     4. AI Style Camera / Canvas Filter Simulator
     ========================================================================== */
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas.getContext('2d');
  const refImage = document.getElementById('ref-image');
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('progress-bar');
  const btnProcess = document.getElementById('btn-process-image');
  
  let currentImageSrc = 'assets/hike_sample.jpg';
  let selectedStyle = 'popart'; // Default style
  let isUploadedImage = false;
  let uploadedImageObj = null;

  // Initialize Canvas dimensions and draw default image
  function initCanvas() {
    if (!canvas) return;
    
    const img = isUploadedImage ? uploadedImageObj : refImage;
    if (!img || !img.complete) {
      // If not loaded yet, wait and try again
      if (img) img.onload = () => initCanvas();
      return;
    }

    // Adjust canvas resolution to match image ratio but cap max size
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

    // Default: draw clean original image
    ctx.filter = 'none';
    ctx.drawImage(img, 0, 0, width, height);
  }

  // Handle Image Source Selection Cards
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

  // Handle local file upload
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
            
            // Highlight upload card
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

  // Handle Style Selection buttons
  const styleBtns = document.querySelectorAll('.style-select-btn');
  styleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStyle = btn.getAttribute('data-style');
    });
  });

  // AI Style Processing Trigger (Simulated with progress bar)
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
          
          // Apply Style Effect to Canvas
          applyStyleFilter(selectedStyle);
          
          setTimeout(() => {
            loader.classList.remove('active');
          }, 300);
        }
      }, 150); // Generates in 1.5 seconds total
    });
  }

  /* ==========================================================================
     Canvas Filter Implementations (Pop-Art, Art Nouveau, Ukiyo-e, etc.)
     ========================================================================== */
  function applyStyleFilter(style) {
    const img = isUploadedImage ? uploadedImageObj : refImage;
    if (!img) return;

    const w = canvas.width;
    const h = canvas.height;

    // Reset canvas with fresh draw
    ctx.filter = 'none';
    ctx.clearRect(0, 0, w, h);

    if (style === 'popart') {
      // Andy Warhol 4-Grid Style
      // Draw 2x2 grid, each with high-contrast duotone maps
      const halfW = w / 2;
      const halfH = h / 2;

      // Color maps for the 4 grids: [Background Color, Foreground Color]
      const colorSchemes = [
        ['#ffff00', '#0000ff'], // Grid 1: Yellow background, Blue foreground
        ['#ff007f', '#ffff00'], // Grid 2: Pink background, Yellow foreground
        ['#38bdf8', '#ef4444'], // Grid 3: Light Blue background, Red foreground
        ['#10b981', '#0b0f19']  // Grid 4: Green background, Dark Blue foreground
      ];

      // Draw each of the 4 grids
      for (let i = 0; i < 4; i++) {
        const dx = (i % 2) * halfW;
        const dy = Math.floor(i / 2) * halfH;

        // Draw normal image to temporary area
        ctx.drawImage(img, dx, dy, halfW, halfH);

        // Apply pixel duotone effect to this quadrant
        const imgData = ctx.getImageData(dx, dy, halfW, halfH);
        const data = imgData.data;
        const bg = hexToRgb(colorSchemes[i][0]);
        const fg = hexToRgb(colorSchemes[i][1]);

        for (let j = 0; j < data.length; j += 4) {
          const r = data[j];
          const g = data[j+1];
          const b = data[j+2];
          
          // Grayscale value
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // High contrast map (stretch contrast for pop-art silkscreen effect)
          let factor = gray;
          if (gray < 100) factor = 0;       // shadows go full foreground
          else if (gray > 180) factor = 255; // highlights go full background
          else factor = (gray - 100) * (255 / 80); // midtones ramped up

          // Map factor (0 to 255) between foreground and background
          const pct = factor / 255;
          data[j]   = fg.r + (bg.r - fg.r) * pct; // R
          data[j+1] = fg.g + (bg.g - fg.g) * pct; // G
          data[j+2] = fg.b + (bg.b - fg.b) * pct; // B
        }
        ctx.putImageData(imgData, dx, dy);

        // Draw subtle black dividers
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx, dy, halfW, halfH);
      }
    } 
    else if (style === 'artnouveau') {
      // Art Nouveau: Warm golden filters + organic decorative frame
      ctx.filter = 'sepia(0.55) contrast(1.1) brightness(1.05) saturate(1.25)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      // Draw Art Nouveau organic double borders
      const padding = Math.min(w, h) * 0.05;
      
      // Outer border (Gold)
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.strokeRect(padding / 2, padding / 2, w - padding, h - padding);

      // Inner thin border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);

      // Draw floral design corners
      drawArtNouveauCorner(ctx, padding, padding, 0); // Top-left
      drawArtNouveauCorner(ctx, w - padding, padding, Math.PI / 2); // Top-right
      drawArtNouveauCorner(ctx, padding, h - padding, -Math.PI / 2); // Bottom-left
      drawArtNouveauCorner(ctx, w - padding, h - padding, Math.PI); // Bottom-right

      // Text Header at bottom inside border
      ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
      ctx.fillRect(padding, h - padding - 36, w - padding * 2, 36);

      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${Math.max(12, Math.round(w * 0.03))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText('溪頭一日健行 • 藝術寫真', w / 2, h - padding - 12);
    } 
    else if (style === 'ukiyoe') {
      // Ukiyo-e: Clean lines, flat coloring, high contrast sepia-blue hue
      ctx.filter = 'contrast(1.3) saturate(1.2) sepia(0.3)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      // Simulate woodblock ink lines by drawing a subtle edge-overlay (simplistic Sobel/Outline simulation)
      // For performance & robust browser behavior, we'll draw a thin vignette and stamp look
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, w, h);

      // Red seal stamp (classic in Ukiyo-e)
      const stampSize = Math.max(30, Math.round(w * 0.07));
      const sx = w - stampSize - 20;
      const sy = 20;
      
      ctx.fillStyle = '#ef4444'; // Red seal
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
      // Impressionism: Pointillism/brush stroke simulation
      // We will redraw the image using random circular paint dabs
      ctx.drawImage(img, 0, 0, w, h);
      
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      
      // Clear canvas with base background color
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      // Draw thousands of colored brush strokes
      const strokesCount = w * h * 0.08; // density
      const maxBrushSize = Math.max(8, w * 0.025);

      for (let k = 0; k < strokesCount; k++) {
        const rx = Math.floor(Math.random() * w);
        const ry = Math.floor(Math.random() * h);
        
        // Read color at pixel
        const idx = (ry * w + rx) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const a = data[idx+3] / 255;

        // Draw dab
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.85})`;
        ctx.beginPath();
        // random brush rotation
        const radiusX = Math.random() * maxBrushSize + 2;
        const radiusY = Math.random() * (maxBrushSize / 2) + 1;
        const angle = Math.random() * Math.PI;
        ctx.ellipse(rx, ry, radiusX, radiusY, angle, 0, 2 * Math.PI);
        ctx.fill();
      }
    } 
    else if (style === 'vintage') {
      // Vintage Old Photo: Heavy sepia, low contrast, subtle noise
      ctx.filter = 'sepia(0.85) contrast(0.8) brightness(0.95)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      // Draw scratches & dust
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
      
      // Draw dark vignette
      const gradient = ctx.createRadialGradient(w/2, h/2, Math.min(w,h) * 0.4, w/2, h/2, Math.max(w,h) * 0.7);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Helper: Hex color to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // Helper: Draw organic vine corner for Art Nouveau
  function drawArtNouveauCorner(ctx, cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;

    // Draw spiral vine
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(15, 5, 20, 30, 5, 35);
    ctx.bezierCurveTo(-10, 40, -25, 20, -10, 5);
    ctx.stroke();

    // Draw little leaves
    ctx.beginPath();
    ctx.ellipse(18, 12, 6, 3, Math.PI / 4, 0, 2 * Math.PI);
    ctx.ellipse(6, 28, 5, 2, -Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  // Handle image download
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
  
  // Default Pre-loaded artworks
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

  // Load artworks from localStorage or use default
  function getArtworks() {
    const stored = localStorage.getItem('ai_class_artworks');
    if (!stored) {
      localStorage.setItem('ai_class_artworks', JSON.stringify(defaultArtworks));
      return defaultArtworks;
    }
    return JSON.parse(stored);
  }

  // Save new artwork
  function saveArtwork(artwork) {
    const list = getArtworks();
    list.unshift(artwork); // Prepend to show first
    localStorage.setItem('ai_class_artworks', JSON.stringify(list));
    renderPhotoWall();
  }

  // Render the Photo Wall grid
  function renderPhotoWall() {
    if (!photoWall) return;

    const list = getArtworks();
    photoWall.innerHTML = '';
    
    // Update Counter badge
    if (classPhotoCount) {
      classPhotoCount.innerText = list.length;
    }

    list.forEach(art => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      
      // Extract first letter of name for avatar
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

  // Handle Form Manual Upload in Photo Wall Tab
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

      // Reset form
      wallForm.reset();
      fileChosenText.innerText = '尚未選擇檔案';
      thumbWrapper.style.display = 'none';
      manualUploadBase64 = '';

      // Auto scroll to photo wall section
      const wallSection = document.getElementById('photo-wall');
      if (wallSection) {
        wallSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Clear Storage / Reset button
  const btnClear = document.getElementById('btn-clear-storage');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('確定要將照片牆重設為預設作品嗎？這會清除您剛才上傳的內容。')) {
        localStorage.removeItem('ai_class_artworks');
        renderPhotoWall();
      }
    });
  }

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
      // Load current canvas data url into modal preview
      const dataUrl = canvas.toDataURL();
      modalPreviewImg.src = dataUrl;

      // Autopopulate current prompt based on selected style
      const modalPromptInput = document.getElementById('modal-uploader-prompt');
      
      let curPrompt = '';
      if (selectedStyle === 'popart') {
        curPrompt = document.getElementById('preview-style-text').innerText;
      } else {
        curPrompt = document.getElementById('preview-formula-text').innerText;
      }
      modalPromptInput.value = curPrompt;

      // Open Modal
      publishModal.classList.add('active');
    });
  }

  const closeModal = () => {
    publishModal.classList.remove('active');
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

      let displayStyleName = 'AI 變身';
      if (selectedStyle === 'popart') displayStyleName = '波普藝術';
      else if (selectedStyle === 'artnouveau') displayStyleName = '新藝術風格';
      else if (selectedStyle === 'ukiyoe') displayStyleName = '浮世繪';
      else if (selectedStyle === 'impressionism') displayStyleName = '印象派';
      else if (selectedStyle === 'vintage') displayStyleName = '復古老片';

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

      // Switch to Photo Wall tab
      tabs.forEach(t => t.classList.remove('active'));
      const wallTabBtn = document.querySelector('[data-tab="wall"]');
      if (wallTabBtn) wallTabBtn.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === 'tab-wall') {
          content.classList.add('active');
        }
      });

      // Auto scroll to photo wall section
      setTimeout(() => {
        const wallSection = document.getElementById('photo-wall');
        if (wallSection) {
          wallSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    });
  }

  // Initialize photo wall rendering on start
  renderPhotoWall();

  // Load canvas after a short delay to ensure elements are sized
  setTimeout(initCanvas, 100);
});
