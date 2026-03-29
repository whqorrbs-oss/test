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
        '헬리오시티': {
            types: [
                { id: '59', label: '전용 59㎡ (25평형)', priceKB: 185000, priceREB: 182000 },
                { id: '84', label: '전용 84㎡ (33평형)', priceKB: 215000, priceREB: 212000 },
                { id: '110', label: '전용 110㎡ (42평형)', priceKB: 260000, priceREB: 258000 }
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
        addMessage("안녕하세요! **K-Loan AI 상담사**입니다.\n정확한 주소와 동/호수 정보를 바탕으로 **KB시세 및 한국부동산원** 데이터를 실시간 조회해 드릴게요.", 'ai');
        setTimeout(askProperty, 1000);
    }

    function askProperty() {
        currentState = 'SELECT_PROPERTY';
        addMessage("먼저, 조회를 시작할 **아파트 주소**를 알려주세요.", 'ai');
        showOptions([{ label: "🏠 주소/단지 검색하기", action: openKakaoPostcode }]);
    }

    function askDongHo() {
        currentState = 'ENTER_DONG_HO';
        addMessage("정확한 면적 산출을 위해 **동과 호수**를 입력해주세요.\n(예: 101동 502호)", 'ai');
        userInput.placeholder = "예: 101동 502호";
        userInput.focus();
    }

    function askAreaType() {
        currentState = 'SELECT_AREA';
        addMessage("건축물대장 정보를 확인했습니다.\n해당 단지의 **평형(타입)**을 선택해주세요.", 'ai');
        
        const key = userData.property.name.includes('헬리오시티') ? '헬리오시티' : 'default';
        const options = MOCK_DATA[key].types.map(t => ({ label: t.label, value: t }));
        showOptions(options);
    }

    async function fetchMarketPrices(typeData) {
        addLoadingMessage();
        
        // Simulate API Lag for KB/REB
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        removeLoadingMessage();
        userData.area = typeData;
        userData.marketPrices = {
            kb: typeData.priceKB,
            reb: typeData.priceREB,
            average: (typeData.priceKB + typeData.priceREB) / 2
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
        currentState = 'SELECT_INCOME';
        addMessage("연간 총 **소득(세전)** 수준을 선택해주세요.", 'ai');
        showOptions([
            { label: "4,000만원 미만", value: 3500 },
            { label: "4,000~7,000만원", value: 5500 },
            { label: "7,000~1억원", value: 8500 },
            { label: "1억원 이상", value: 12000 }
        ]);
    }

    function askDebt() {
        currentState = 'SELECT_DEBT';
        addMessage("기존 대출의 **연간 원리금 상환액**이 있나요?", 'ai');
        showOptions([
            { label: "없음", value: 0 },
            { label: "500만원 미만", value: 300 },
            { label: "500~1,500만원", value: 1000 },
            { label: "1,500만원 이상", value: 2500 }
        ]);
    }

    function showResult() {
        currentState = 'FINISHED';
        addMessage("분석이 완료되었습니다. **정밀 진단 리포트**를 확인하세요.", 'ai');
        
        const result = calculateLimits();
        renderResultCard(result);

        setTimeout(() => {
            showOptions([
                { label: "처음부터 다시", action: () => location.reload() }
            ]);
        }, 1500);
    }

    // --- Event Handlers ---
    function handleUserTextSubmit() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';

        if (currentState === 'ENTER_DONG_HO') {
            const parts = text.split(' ');
            userData.dong = parts[0] || '';
            userData.ho = parts[1] || '';
            userInput.placeholder = "메시지를 입력하세요...";
            setTimeout(askAreaType, 800);
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
        } else if (currentState === 'SELECT_INCOME') {
            userData.income = value;
            setTimeout(askDebt, 800);
        } else if (currentState === 'SELECT_DEBT') {
            userData.existingDebt = value;
            setTimeout(showResult, 800);
        }
    }

    // --- External APIs ---
    function openKakaoPostcode() {
        new kakao.Postcode({
            oncomplete: function(data) {
                userData.property = {
                    name: data.buildingName || data.address,
                    address: data.address
                };
                addMessage(`선택 주소: **${userData.property.name}**`, 'user');
                setTimeout(askDongHo, 800);
            },
            width: '100%',
            height: '100%'
        }).open();
    }

    // --- Calculation & UI Helpers ---
    function calculateLimits() {
        const price = userData.marketPrices.kb; // Usually KB price is the base for LTV
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
            reason: ltvLimit < dsrLimit ? 'LTV(담보가치) 제한' : 'DSR(소득능력) 제한'
        };
    }

    function renderResultCard(res) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h4>${userData.property.name} ${userData.dong} ${userData.ho}</h4>
            <p class="unit-info">${userData.area.label}</p>
            
            <div class="market-prices">
                <div class="market-item"><span>KB시세 (일반가)</span> <span>${formatAmount(userData.marketPrices.kb)}</span></div>
                <div class="market-item"><span>한국부동산원</span> <span>${formatAmount(userData.marketPrices.reb)}</span></div>
            </div>

            <div class="result-amount" style="font-size: 24px;">최종 한도: ${formatAmount(res.total)}</div>
            
            <div class="result-detail"><span>LTV 기준</span> <strong>${formatAmount(res.ltv)}</strong></div>
            <div class="result-detail"><span>DSR 기준</span> <strong>${formatAmount(res.dsr)}</strong></div>
            <div class="result-detail" style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:8px;">
                <span>한도 결정 사유</span>
                <span style="color:var(--primary-color); font-weight:bold;">${res.reason}</span>
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

    function addLoadingMessage() {
        const msg = document.createElement('div');
        msg.className = 'message ai loading-msg';
        msg.innerHTML = `
            <div class="bubble">
                시세를 조회하고 있습니다...
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
