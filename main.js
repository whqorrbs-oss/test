document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const quickActions = document.getElementById('quickActions');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // App State
    let currentState = 'START';
    let userData = {
        property: null,
        dong: '',
        ho: '',
        area: null,
        marketPrices: null,
        houseCount: null,
        income: null,
        existingDebt: 0
    };

    // Simulated API Data (KB, REB, Building Ledger)
    const MOCK_DATA = {
        '11680-10100': { // Example: Gangnam-gu, Yeoksam-dong
            title: "역삼 자이",
            types: [
                { id: '59', label: '전용 59.98㎡ (25평형)', priceKB: 245000, priceREB: 242000 },
                { id: '84', label: '전용 84.99㎡ (33평형)', priceKB: 315000, priceREB: 312000 }
            ]
        },
        'default': {
            types: [
                { id: '59', label: '전용 59㎡', priceKB: 100000, priceREB: 98000 },
                { id: '84', label: '전용 84㎡', priceKB: 130000, priceREB: 128000 }
            ]
        }
    };

    // --- Core Conversation Flow ---
    function initChat() {
        addMessage("안녕하세요! **K-Loan AI 상담사**입니다.\n건축물대장 API와 연동하여 정확한 한도를 진단해 드립니다.", 'ai');
        setTimeout(askProperty, 1000);
    }

    function askProperty() {
        currentState = 'SELECT_PROPERTY';
        addMessage("먼저, 조회를 시작할 **아파트 주소**를 알려주세요.", 'ai');
        showOptions([{ label: "🏠 주소/단지 검색하기", action: openKakaoPostcode }]);
    }

    // Call Mock Building Ledger API
    async function fetchBuildingLedger(sigunguCd, bjdongCd) {
        addLoadingMessage("건축물대장 정보를 조회하고 있습니다...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        removeLoadingMessage();
        
        const key = `${sigunguCd}-${bjdongCd}`;
        const data = MOCK_DATA[key] || MOCK_DATA['default'];
        
        addMessage("국토교통부 건축물대장 조회가 완료되었습니다.", 'ai');
        setTimeout(() => askDongHo(data), 500);
    }

    function askDongHo(ledgerData) {
        currentState = 'ENTER_DONG_HO';
        userData.ledger = ledgerData;
        addMessage("정확한 면적 산출을 위해 **동과 호수**를 입력해주세요.\n(예: 101동 502호)", 'ai');
        userInput.placeholder = "예: 101동 502호";
        userInput.focus();
    }

    function askAreaType() {
        currentState = 'SELECT_AREA';
        addMessage("해당 단지에서 조회된 **평형(타입)**을 선택해주세요.", 'ai');
        const options = userData.ledger.types.map(t => ({ label: t.label, value: t }));
        showOptions(options);
    }

    async function fetchMarketPrices(typeData) {
        addLoadingMessage("KB시세 및 부동산원 데이터를 조회 중입니다...");
        await new Promise(resolve => setTimeout(resolve, 1800));
        removeLoadingMessage();
        
        userData.area = typeData;
        userData.marketPrices = {
            kb: typeData.priceKB,
            reb: typeData.priceREB
        };

        addMessage(`**KB시세**: ${formatAmount(userData.marketPrices.kb)}\n**한국부동산원**: ${formatAmount(userData.marketPrices.reb)}\n시세 조회가 완료되었습니다.`, 'ai');
        setTimeout(askHouseCount, 800);
    }

    function askHouseCount() {
        currentState = 'SELECT_HOUSE_COUNT';
        addMessage("현재 고객님 세대의 **주택 보유 수**를 알려주세요.", 'ai');
        showOptions([
            { label: "무주택", value: 0 },
            { label: "1주택", value: 1 },
            { label: "2주택 이상", value: 2 }
        ]);
    }

    function askIncome() {
        currentState = 'ENTER_INCOME';
        addMessage("고객님의 **연간 총 소득(세전)**을 **만원 단위**로 입력해주세요.\n(예: 6500)", 'ai');
        userInput.placeholder = "숫자만 입력 (예: 6500)";
        userInput.type = "number";
        userInput.focus();
    }

    function askDebt() {
        currentState = 'ENTER_DEBT';
        addMessage("기존 대출의 **연간 원리금 상환액**을 입력해주세요.\n(없으면 0 입력)", 'ai');
        userInput.placeholder = "만원 단위 (예: 1200)";
        userInput.type = "number";
        userInput.focus();
    }

    function showResult() {
        currentState = 'FINISHED';
        userInput.type = "text";
        userInput.placeholder = "메시지를 입력하세요...";
        
        addMessage("모든 정보를 분석했습니다. **정밀 진단 리포트**입니다.", 'ai');
        const result = calculateLimits();
        renderResultCard(result);

        setTimeout(() => {
            showOptions([{ label: "다시 진단하기", action: () => location.reload() }]);
        }, 1500);
    }

    // --- Event Handlers ---
    function handleUserTextSubmit() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';

        if (currentState === 'ENTER_DONG_HO') {
            userData.dong = text.split(' ')[0] || '';
            userData.ho = text.split(' ')[1] || '';
            setTimeout(askAreaType, 800);
        } else if (currentState === 'ENTER_INCOME') {
            userData.income = parseFloat(text);
            setTimeout(askDebt, 800);
        } else if (currentState === 'ENTER_DEBT') {
            userData.existingDebt = parseFloat(text);
            setTimeout(showResult, 800);
        }
    }

    function handleUserSelect(label, value) {
        addMessage(label, 'user');
        quickActions.innerHTML = '';

        if (currentState === 'SELECT_AREA') {
            fetchMarketPrices(value);
        } else if (currentState === 'SELECT_HOUSE_COUNT') {
            userData.houseCount = value;
            setTimeout(askIncome, 800);
        }
    }

    // --- External APIs ---
    function openKakaoPostcode() {
        new kakao.Postcode({
            oncomplete: function(data) {
                // Kakao provides sigunguCd and bjdongCd
                const sigunguCd = data.sigunguCode; // 5 digits
                const bjdongCd = data.bjdongCode.substring(5); // Last 5 digits of 10-digit code
                
                userData.property = {
                    name: data.buildingName || data.address,
                    sigunguCd: sigunguCd,
                    bjdongCd: bjdongCd
                };
                
                addMessage(`선택 주소: **${userData.property.name}**`, 'user');
                // Pass codes to fetch building ledger
                setTimeout(() => fetchBuildingLedger(sigunguCd, bjdongCd), 800);
            },
            width: '100%',
            height: '100%'
        }).open();
    }

    // --- Calculation & UI Helpers ---
    function calculateLimits() {
        const price = userData.marketPrices.kb;
        const income = userData.income;
        const debt = userData.existingDebt;
        const houses = userData.houseCount;

        let ltvRatio = houses === 0 ? 0.7 : (houses === 1 ? 0.6 : 0.3);
        const ltvLimit = price * ltvRatio;

        const dsrRatio = 0.4;
        const availableRepay = (income * dsrRatio) - debt;
        const r = 0.045 / 12;
        const n = 40 * 12;
        let dsrLimit = 0;
        if (availableRepay > 0) {
            dsrLimit = (availableRepay / 12 * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
        }

        return {
            total: Math.min(ltvLimit, dsrLimit),
            ltv: ltvLimit,
            dsr: dsrLimit,
            reason: ltvLimit < dsrLimit ? 'LTV(담보가치) 제한' : 'DSR(소득상환능력) 제한'
        };
    }

    function renderResultCard(res) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h4>${userData.property.name} ${userData.dong} ${userData.ho}</h4>
            <p class="unit-info">${userData.area.label}</p>
            <div class="market-prices">
                <div class="market-item"><span>KB시세</span> <span>${formatAmount(userData.marketPrices.kb)}</span></div>
                <div class="market-item"><span>연소득</span> <span>${formatAmount(userData.income)}</span></div>
            </div>
            <div class="result-amount" style="font-size: 26px;">최대 한도: ${formatAmount(res.total)}</div>
            <div class="result-detail"><span>LTV 기준</span> <strong>${formatAmount(res.ltv)}</strong></div>
            <div class="result-detail"><span>DSR 기준</span> <strong>${formatAmount(res.dsr)}</strong></div>
            <div class="result-detail" style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:8px;">
                <span style="font-size: 12px;">결정 사유: ${res.reason}</span>
            </div>
        `;
        chatMessages.appendChild(card);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addLoadingMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'message ai loading-msg';
        msg.innerHTML = `
            <div class="bubble">
                ${text}
                <div class="loading-dots">
                    <div class="dot-item"></div><div class="dot-item"></div><div class="dot-item"></div>
                </div>
            </div>`;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeLoadingMessage() {
        const loader = document.querySelector('.loading-msg');
        if (loader) loader.remove();
    }

    function showOptions(options) {
        quickActions.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.textContent = opt.label;
            btn.onclick = () => {
                if (opt.action) opt.action();
                else handleUserSelect(opt.label, opt.value);
            };
            quickActions.appendChild(btn);
        });
    }

    function formatAmount(amt) {
        if (!amt) return "0원";
        if (amt >= 10000) return (amt / 10000).toFixed(2) + '억원';
        return Math.round(amt).toLocaleString() + '만원';
    }

    sendBtn.onclick = handleUserTextSubmit;
    userInput.onkeypress = (e) => { if (e.key === 'Enter') handleUserTextSubmit(); };
    themeToggleBtn.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    };

    initChat();
});
