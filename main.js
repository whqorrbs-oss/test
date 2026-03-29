document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const quickActions = document.getElementById('quickActions');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    const searchModal = document.getElementById('searchModal');
    const closeModal = document.getElementById('closeModal');
    const propertySearch = document.getElementById('propertySearch');
    const searchResults = document.getElementById('searchResults');

    // App State
    let currentState = 'START';
    let userData = {
        property: null,
        houseCount: null,
        income: null,
        existingDebt: 0
    };

    // Mock Apartment Data
    const APARTMENTS = [
        { name: '헬리오시티', price: 210000, address: '서울시 송파구 가락동' },
        { name: '반포자이', price: 350000, address: '서울시 서초구 반포동' },
        { name: '마포래미안푸르지오', price: 185000, address: '서울시 마포구 아현동' },
        { name: '잠실엘스', price: 245000, address: '서울시 송파구 잠실동' },
        { name: '경희궁자이', price: 210000, address: '서울시 종로구 홍파동' },
        { name: '고덕그라시움', price: 165000, address: '서울시 강동구 고덕동' },
        { name: '목동신시가지7단지', price: 195000, address: '서울시 양천구 목동' }
    ];

    // --- Core Conversation Flow ---
    function initChat() {
        addMessage("안녕하세요! **K-Loan AI 상담사**입니다.\n복잡한 대출 규제를 분석해 고객님의 **예상 대출 한도**를 정확히 짚어드릴게요.", 'ai');
        setTimeout(() => {
            askProperty();
        }, 1000);
    }

    function askProperty() {
        currentState = 'SELECT_PROPERTY';
        addMessage("먼저, 한도가 궁금하신 **아파트나 주소**를 알려주세요.", 'ai');
        showOptions([{ label: "🏠 아파트 검색하기", action: openSearchModal }]);
    }

    function askHouseCount() {
        currentState = 'SELECT_HOUSE_COUNT';
        addMessage(`**${userData.property.name}**을 선택하셨군요.\n현재 고객님 세대의 **주택 보유 수**는 어떻게 되시나요?`, 'ai');
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
        addMessage("혹시 다른 대출의 **연간 상환액**이 있으신가요?", 'ai');
        showOptions([
            { label: "없음", value: 0 },
            { label: "500만원 미만", value: 300 },
            { label: "500~1,500만원", value: 1000 },
            { label: "1,500만원 이상", value: 2500 }
        ]);
    }

    function showResult() {
        currentState = 'FINISHED';
        addMessage("모든 분석이 끝났습니다! 고객님의 예상 한도 리포트입니다.", 'ai');
        
        const result = calculateLimits();
        renderResultCard(result);

        setTimeout(() => {
            addMessage("더 궁금하신 점이 있나요? '디딤돌 대출'이나 '생애최초 특례' 등에 대해 물어보실 수 있습니다.", 'ai');
            showOptions([
                { label: "다시 진단하기", action: () => location.reload() },
                { label: "상담 종료", action: () => addMessage("이용해주셔서 감사합니다!", "ai") }
            ]);
        }, 1500);
    }

    // --- UI Helpers ---
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showOptions(options) {
        quickActions.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.textContent = opt.label;
            btn.onclick = () => {
                if (opt.action) {
                    opt.action();
                } else {
                    handleUserSelect(opt.label, opt.value);
                }
            };
            quickActions.appendChild(btn);
        });
    }

    function handleUserSelect(label, value) {
        addMessage(label, 'user');
        quickActions.innerHTML = '';

        if (currentState === 'SELECT_HOUSE_COUNT') {
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

    // --- Search Modal Logic ---
    function openSearchModal() {
        searchModal.style.display = 'flex';
        propertySearch.focus();
    }

    closeModal.onclick = () => searchModal.style.display = 'none';

    propertySearch.oninput = (e) => {
        const query = e.target.value.trim();
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }
        const filtered = APARTMENTS.filter(apt => apt.name.includes(query) || apt.address.includes(query));
        searchResults.innerHTML = filtered.map(apt => `
            <div class="modal-item" data-name="${apt.name}" data-price="${apt.price}">
                <strong>${apt.name}</strong><br>
                <small>${apt.address}</small>
            </div>
        `).join('');
    };

    searchResults.onclick = (e) => {
        const item = e.target.closest('.modal-item');
        if (!item) return;

        userData.property = {
            name: item.dataset.name,
            price: parseInt(item.dataset.price)
        };

        searchModal.style.display = 'none';
        addMessage(`선택 단지: **${userData.property.name}**`, 'user');
        setTimeout(askHouseCount, 800);
    };

    // --- Calculation Logic ---
    function calculateLimits() {
        const price = userData.property.price;
        const income = userData.income;
        const debt = userData.existingDebt;
        const houses = userData.houseCount;

        // LTV
        let ltvRatio = houses === 0 ? 0.7 : (houses === 1 ? 0.6 : 0.3);
        const ltvLimit = price * ltvRatio;

        // DSR (4.5% interest, 40 years)
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
            reason: ltvLimit < dsrLimit ? '담보 가치(LTV) 제한' : '상환 능력(DSR) 제한'
        };
    }

    function renderResultCard(res) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h4>${userData.property.name} 예상 한도</h4>
            <div class="result-amount">${formatAmount(res.total)}</div>
            <div class="result-detail">
                <span>LTV 기준 한도</span>
                <strong>${formatAmount(res.ltv)}</strong>
            </div>
            <div class="result-detail">
                <span>DSR 기준 한도</span>
                <strong>${formatAmount(res.dsr)}</strong>
            </div>
            <div class="result-detail" style="margin-top:12px; border-top:1px solid #eee; padding-top:8px;">
                <span>한도 결정 사유</span>
                <span style="color:var(--primary-color); font-weight:bold;">${res.reason}</span>
            </div>
        `;
        chatMessages.appendChild(card);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatAmount(amt) {
        if (amt >= 10000) return (amt / 10000).toFixed(2) + '억원';
        return Math.round(amt).toLocaleString() + '만원';
    }

    // --- Utilities ---
    themeToggleBtn.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    };

    // Chat Input (Optional for generic questions)
    sendBtn.onclick = () => {
        const text = userInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        userInput.value = '';
        setTimeout(() => addMessage("대출 관련 질문이신가요? 아직은 한도 진단 절차에 집중하고 있습니다. 버튼을 눌러 진행해주세요!", "ai"), 800);
    };

    // Start Chat
    initChat();
});
