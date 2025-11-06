const productDatabase = {
    "4903301318620": {
        name: "ポカリスエット 500ml",
        image: "images/artist.jpg"
    },
    "4901777337398": {
        name: "イオン天然水 2L",
        image: "https://via.placeholder.com/300x300/50C878/ffffff?text=天然水"
    },
    "4901777277397": {
        name: "おにぎり（鮭）",
        image: "https://via.placeholder.com/300x300/FFB347/ffffff?text=おにぎり"
    },
    "4901777017770": {
        name: "チョコレートバー",
        image: "https://via.placeholder.com/300x300/8B4513/ffffff?text=チョコレート"
    }
};

let html5QrcodeScanner;
let scannedRecords = [];
let currentSessionItems = [];
let lastScannedBarcode = null;
let lastScanTime = 0;
const SCAN_COOLDOWN = 2000;

const startScanBtn = document.getElementById('start-scan-btn');
const stopScanBtn = document.getElementById('stop-scan-btn');
const finishScanBtn = document.getElementById('finish-scan-btn');
const sessionItemsSection = document.getElementById('session-items-section');
const sessionItemsCount = document.getElementById('session-items-count');
const sessionItemsList = document.getElementById('session-items-list');
const productSection = document.getElementById('product-section');
const scannedProductsList = document.getElementById('scanned-products-list');
const wtpInput = document.getElementById('wtp-input');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const clearDataBtn = document.getElementById('clear-data-btn');
const recordCountEl = document.getElementById('record-count');

function playBeepSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 2000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Audio playback failed:', error);
    }
}

function onScanSuccess(decodedText, decodedResult) {
    const currentTime = Date.now();
    
    if (lastScannedBarcode === decodedText && (currentTime - lastScanTime) < SCAN_COOLDOWN) {
        return;
    }
    
    console.log(`Barcode detected: ${decodedText}`);
    
    lastScannedBarcode = decodedText;
    lastScanTime = currentTime;
    
    const productData = productDatabase[decodedText];
    let productName, productImage;
    
    if (productData) {
        productName = productData.name;
        productImage = productData.image;
    } else {
        productName = "未登録商品";
        productImage = "https://via.placeholder.com/300x300/cccccc/666666?text=未登録商品";
    }
    
    currentSessionItems.push({
        barcode: decodedText,
        name: productName,
        image: productImage
    });
    
    updateSessionItemsList();
    
    playBeepSound();
    
    if (window.navigator.vibrate) {
        window.navigator.vibrate(200);
    }
}

function onScanFailure(error) {
}

function updateSessionItemsList() {
    sessionItemsCount.textContent = `${currentSessionItems.length}点`;
    
    if (currentSessionItems.length === 0) {
        sessionItemsSection.style.display = 'none';
        finishScanBtn.style.display = 'none';
        return;
    }
    
    sessionItemsSection.style.display = 'block';
    finishScanBtn.style.display = 'inline-block';
    
    sessionItemsList.innerHTML = currentSessionItems.map((item, index) => `
        <div class="session-item">
            <img src="${item.image}" alt="${item.name}" class="session-item-image">
            <div class="session-item-info">
                <div class="session-item-name">${item.name}</div>
                <div class="session-item-barcode">${item.barcode}</div>
            </div>
        </div>
    `).join('');
}

function startScanning() {
    currentSessionItems = [];
    lastScannedBarcode = null;
    lastScanTime = 0;
    updateSessionItemsList();
    
    const config = {
        fps: 35,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8
        ]
    };

    html5QrcodeScanner = new Html5Qrcode("reader");
    
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).then(() => {
        console.log("Scanner started successfully");
        startScanBtn.style.display = 'none';
        stopScanBtn.style.display = 'inline-block';
    }).catch((err) => {
        console.error("Failed to start scanner:", err);
        alert("カメラの起動に失敗しました。HTTPSでアクセスしているか、カメラの許可を与えているか確認してください。");
    });
}

function stopScanning() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            console.log("Scanner stopped successfully");
            startScanBtn.style.display = 'inline-block';
            stopScanBtn.style.display = 'none';
            finishScanBtn.style.display = 'none';
            sessionItemsSection.style.display = 'none';
            currentSessionItems = [];
            lastScannedBarcode = null;
            lastScanTime = 0;
        }).catch((err) => {
            console.error("Failed to stop scanner:", err);
        });
    }
}

function finishScanning() {
    if (currentSessionItems.length === 0) {
        alert('商品がスキャンされていません');
        return;
    }
    
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            console.log("Scanner stopped for WTP input");
            stopScanBtn.style.display = 'none';
            finishScanBtn.style.display = 'none';
            sessionItemsSection.style.display = 'none';
            showWTPInput();
        }).catch((err) => {
            console.error("Failed to stop scanner:", err);
        });
    }
}

function showWTPInput() {
    scannedProductsList.innerHTML = currentSessionItems.map((item, index) => `
        <div class="scanned-product-item">
            <img src="${item.image}" alt="${item.name}" class="scanned-product-image">
            <div class="scanned-product-info">
                <div class="scanned-product-name">${item.name}</div>
                <div class="scanned-product-barcode">${item.barcode}</div>
            </div>
        </div>
    `).join('');
    
    productSection.style.display = 'block';
    wtpInput.value = '';
    wtpInput.focus();
}

function cancelWTPInput() {
    productSection.style.display = 'none';
    currentSessionItems = [];
    startScanBtn.style.display = 'inline-block';
}

function submitWTP() {
    const wtpValue = wtpInput.value.trim();
    
    if (!wtpValue || parseFloat(wtpValue) < 0) {
        alert('有効な金額を入力してください');
        return;
    }
    
    if (currentSessionItems.length === 0) {
        alert('スキャンした商品がありません');
        return;
    }
    
    const timestamp = new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const barcodes = currentSessionItems.map(item => item.barcode).join('|');
    const productNames = currentSessionItems.map(item => item.name).join('|');
    const itemCount = currentSessionItems.length;
    
    const record = {
        timestamp: timestamp,
        barcode: barcodes,
        productName: productNames,
        itemCount: itemCount,
        wtp: parseFloat(wtpValue)
    };
    
    scannedRecords.push(record);
    
    saveToLocalStorage();
    updateRecordDisplay();
    
    productSection.style.display = 'none';
    currentSessionItems = [];
    wtpInput.value = '';
    startScanBtn.style.display = 'inline-block';
    
    alert('記録しました！');
}

function saveToLocalStorage() {
    localStorage.setItem('wtpRecords', JSON.stringify(scannedRecords));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('wtpRecords');
    if (saved) {
        scannedRecords = JSON.parse(saved);
        updateRecordDisplay();
    }
}

function updateRecordDisplay() {
    recordCountEl.textContent = `記録件数: ${scannedRecords.length}件`;
    
    downloadCsvBtn.disabled = scannedRecords.length === 0;
}

function downloadCSV() {
    if (scannedRecords.length === 0) {
        alert('ダウンロードする記録がありません');
        return;
    }
    
    const headers = ['タイムスタンプ', '商品数', 'バーコード番号', '商品名', 'WTP金額'];
    const csvContent = [
        headers.join(','),
        ...scannedRecords.map(record => {
            const itemCount = record.itemCount || 1;
            return `"${record.timestamp}",${itemCount},"${record.barcode}","${record.productName}",${record.wtp}`;
        })
    ].join('\n');
    
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `wtp_data_${timestamp}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

function clearData() {
    if (scannedRecords.length === 0) {
        alert('クリアする記録がありません');
        return;
    }
    
    if (confirm(`${scannedRecords.length}件の記録を削除しますか？この操作は取り消せません。`)) {
        scannedRecords = [];
        saveToLocalStorage();
        updateRecordDisplay();
        alert('記録をクリアしました');
    }
}

startScanBtn.addEventListener('click', startScanning);
stopScanBtn.addEventListener('click', stopScanning);
finishScanBtn.addEventListener('click', finishScanning);
submitBtn.addEventListener('click', submitWTP);
cancelBtn.addEventListener('click', cancelWTPInput);
downloadCsvBtn.addEventListener('click', downloadCSV);
clearDataBtn.addEventListener('click', clearData);

wtpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitWTP();
    }
});

loadFromLocalStorage();

console.log('WTP Barcode Scanner App initialized');
