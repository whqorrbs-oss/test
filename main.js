document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const calcLimitBtn = document.getElementById('calcLimitBtn');
    const propertySearch = document.getElementById('propertySearch');
    const searchResults = document.getElementById('searchResults');
    const selectedProperty = document.getElementById('selectedProperty');
    const propNameEl = document.getElementById('propName');
    const propPriceEl = document.getElementById('propPrice');
    const chips = document.querySelectorAll('.chip');

    // Mock Property Data (KB Market Price & REB Price Simulation)
    const APARTMENTS = [
        { name: '헬리오시티', price: 210000, address: '서울시 송파구 가락동' },
        { name: '반포자이', price: 350000, address: '서울시 서초구 반포동' },
        { name: '마포래미안푸르지오', price: 185000, address: '서울시 마포구 아현동' },
        { name: '잠실엘스', price: 245000, address: '서울시 송파구 잠실동' },
        { name: '경희궁자이', price: 210000, address: '서울시 종로구 홍파동' },
        { name: '래미안퍼스티지', price: 380000, address: '서울시 서초구 반포동' },
        { name: '아크로리버파크', price: 420000, address: '서울시 서초구 반포동' }
    ];

    let currentSelectedPrice = 0;

    // --- Property Search Logic ---
    propertySearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = APARTMENTS.filter(apt => apt.name.toLowerCase().includes(query));
        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(apt => `
                <div class="search-item" data-name="${apt.name}" data-price="${apt.price}">
                    <strong>${apt.name}</strong><br>
                    <small>${apt.address}</small>
                </div>
            `).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-item');
        if (!item) return;

        const name = item.dataset.name;
        const price = parseInt(item.dataset.price);

        currentSelectedPrice = price;
        propNameEl.textContent = name;
        propPriceEl.textContent = (price / 10000).toFixed(1) + '억원 (KB/부동산원 시세)';
        selectedProperty.style.display = 'flex';
        searchResults.style.display = 'none';
        propertySearch.value = name;
    });

    // --- Limit Estimation Logic (LTV/DSR) ---
    calcLimitBtn.addEventListener('click', () => {
        if (currentSelectedPrice === 0) {
            alert('먼저 단지를 선택해주세요.');
            return;
        }

        const annualIncome = parseFloat(document.getElementById('annualIncome').value);
        const existingDebt = parseFloat(document.getElementById('existingDebt').value);
        const houseCount = parseInt(document.getElementById('houseCount').value);

        // 1. LTV Calculation
        let ltvRatio = 0.7; // Default
        if (houseCount === 1) ltvRatio = 0.6;
        if (houseCount >= 2) ltvRatio = 0.3;
        
        const ltvLimit = currentSelectedPrice * ltvRatio;

        // 2. DSR Calculation (Simulated)
        // Assume 40% DSR, 4.5% interest rate, 40 years term for the new loan
        const dsrRatio = 0.4;
        const availableAnnualRepayment = (annualIncome * dsrRatio) - existingDebt;
        
        // Mortgage Amortization Formula to reverse-calculate Principal
        // P = r / (i * (1 + i)^n / ((1 + i)^n - 1))
        const annualRate = 0.045;
        const monthlyRate = annualRate / 12;
        const totalMonths = 40 * 12;
        const monthlyRepayment = availableAnnualRepayment / 12;
        
        let dsrLimit = 0;
        if (monthlyRepayment > 0) {
            dsrLimit = (monthlyRepayment * (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
        }

        // 3. Final Result (Min of LTV and DSR)
        const maxLoan = Math.min(ltvLimit, dsrLimit);

        document.getElementById('maxLoanAmount').textContent = formatAmount(maxLoan);
        document.getElementById('ltvLimit').textContent = formatAmount(ltvLimit);
        document.getElementById('dsrLimit').textContent = formatAmount(dsrLimit);
        document.getElementById('limitResult').style.display = 'block';

        // Add AI Commentary
        addMessage(`선택하신 **${propNameEl.textContent}**에 대한 한도 분석 결과입니다.
        - **LTV 기준**: ${(ltvRatio * 100)}% 적용 시 약 ${formatAmount(ltvLimit)} 가능
        - **DSR 기준**: 연소득 대비 약 ${formatAmount(dsrLimit)} 가능
        
        현재 고객님의 경우 **${ltvLimit < dsrLimit ? 'LTV(담보가치)' : 'DSR(소득상환능력)'}** 규제에 의해 최종 한도가 결정되었습니다.`, 'ai');
    });

    function formatAmount(amt) {
        if (amt >= 10000) {
            return (amt / 10000).toFixed(2) + '억원';
        }
        return Math.round(amt).toLocaleString() + '만원';
    }

    // --- Theme Toggle ---
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggleBtn.innerHTML = newTheme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    });

    // --- Chat Logic ---
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<div class="bubble">${text}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleChat() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';

        setTimeout(() => {
            const response = getMockAIResponse(text);
            addMessage(response, 'ai');
        }, 800);
    }

    sendBtn.addEventListener('click', handleChat);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            userInput.value = chip.textContent.replace(/[🏠🏢💼🔍]/g, '').trim();
            handleChat();
        });
    });

    function getMockAIResponse(query) {
        if (query.includes('디딤돌')) {
            return "🏠 **내집마련 디딤돌 대출**은 무주택 서민을 위한 저금리 구입 자금 대출입니다.\n- **LTV**: 최대 70% (생애최초 80%)\n- **DSR**: 적용 제외 (DTI 60% 적용) 하여 한도가 더 넉넉할 수 있습니다.";
        }
        if (query.includes('LTV') || query.includes('DSR')) {
            return "🔍 **대출 규제 핵심**\n- **LTV**: 집값 대비 한도 (현재 비규제지역 70%)\n- **DSR**: 내 소득으로 이자를 감당할 수 있는지 보는 지표 (현재 40% 규제).\n**한도 진단기**에 소득을 입력하시면 정확한 값을 계산해 드립니다.";
        }
        return "현재 한국의 대출 규제는 **소득(DSR)**에 따라 한도가 크게 좌우됩니다. 왼쪽 진단기에 연소득과 기존 대출을 입력해 보시면 가장 정확한 추정 한도를 확인하실 수 있습니다.";
    }
});
