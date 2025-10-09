const productDatabase = {
    "4903301318620": {
        name: "ポカリスエット 500ml",
        image: "https://via.placeholder.com/300x300/4A90E2/ffffff?text=ポカリスエット"
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
let currentBarcode = null;
let currentProductName = null;

const startScanBtn = document.getElementById('start-scan-btn');
const stopScanBtn = document.getElementById('stop-scan-btn');
const productSection = document.getElementById('product-section');
const barcodeNumberEl = document.getElementById('barcode-number');
const productNameEl = document.getElementById('product-name');
const productImageEl = document.getElementById('product-image');
const wtpInput = document.getElementById('wtp-input');
const submitBtn = document.getElementById('submit-btn');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const clearDataBtn = document.getElementById('clear-data-btn');
const recordCountEl = document.getElementById('record-count');
const recordsListEl = document.getElementById('records-list');

function onScanSuccess(decodedText, decodedResult) {
    console.log(`Barcode detected: ${decodedText}`);
    
    currentBarcode = decodedText;
    const productData = productDatabase[decodedText];
    
    if (productData) {
        currentProductName = productData.name;
        productImageEl.src = productData.image;
        productImageEl.style.display = 'block';
    } else {
        currentProductName = "未登録商品";
        productImageEl.src = "https://via.placeholder.com/300x300/cccccc/666666?text=未登録商品";
        productImageEl.style.display = 'block';
    }
    
    barcodeNumberEl.textContent = currentBarcode;
    productNameEl.textContent = currentProductName;
    
    productSection.style.display = 'block';
    wtpInput.value = '';
    wtpInput.focus();
    
    stopScanning();
    
    if (window.navigator.vibrate) {
        window.navigator.vibrate(200);
    }
}

function onScanFailure(error) {
    console.log(`Scan error: ${error}`);
}

function startScanning() {
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
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
        }).catch((err) => {
            console.error("Failed to stop scanner:", err);
        });
    }
}

function submitWTP() {
    const wtpValue = wtpInput.value.trim();
    
    if (!wtpValue || parseFloat(wtpValue) < 0) {
        alert('有効な金額を入力してください');
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
    
    const record = {
        timestamp: timestamp,
        barcode: currentBarcode,
        productName: currentProductName,
        wtp: parseFloat(wtpValue)
    };
    
    scannedRecords.push(record);
    
    saveToLocalStorage();
    updateRecordDisplay();
    
    productSection.style.display = 'none';
    currentBarcode = null;
    currentProductName = null;
    wtpInput.value = '';
    
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
    
    if (scannedRecords.length === 0) {
        recordsListEl.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
        return;
    }
    
    const recentRecords = scannedRecords.slice(-5).reverse();
    
    recordsListEl.innerHTML = recentRecords.map(record => `
        <div class="record-item">
            <div class="record-time">${record.timestamp}</div>
            <div class="record-details">
                ${record.productName} (${record.barcode}) - ¥${record.wtp}
            </div>
        </div>
    `).join('');
}

function downloadCSV() {
    if (scannedRecords.length === 0) {
        alert('ダウンロードする記録がありません');
        return;
    }
    
    const headers = ['タイムスタンプ', 'バーコード番号', '商品名', 'WTP金額'];
    const csvContent = [
        headers.join(','),
        ...scannedRecords.map(record => 
            `"${record.timestamp}","${record.barcode}","${record.productName}",${record.wtp}`
        )
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
submitBtn.addEventListener('click', submitWTP);
downloadCsvBtn.addEventListener('click', downloadCSV);
clearDataBtn.addEventListener('click', clearData);

wtpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitWTP();
    }
});

loadFromLocalStorage();

console.log('WTP Barcode Scanner App initialized');
