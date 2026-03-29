document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const calcBtn = document.getElementById('calcBtn');
    const chips = document.querySelectorAll('.chip');
    const loanCategory = document.getElementById('loanCategory');
    const loanPurpose = document.getElementById('loanPurpose');

    const purposeOptions = {
        household: [
            { value: 'home', text: '주택구입' },
            { value: 'living', text: '생활안정자금' }
        ],
        business: [
            { value: 'individual', text: '개인사업자' },
            { value: 'corp', text: '법인' }
        ]
    };

    loanCategory.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        const options = purposeOptions[selectedCategory];
        
        loanPurpose.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
    });

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

        // Simulate AI Response (In a real app, this would call an LLM API)
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
            userInput.value = chip.textContent.replace(/[🏠🏢📉🔍]/g, '').trim();
            handleChat();
        });
    });

    // --- Mock AI Knowledge Base (Korean Loan Specialist) ---
    function getMockAIResponse(query) {
        if (query.includes('디딤돌')) {
            return "🏠 **내집마련 디딤돌 대출**은 무주택 서민을 위한 저금리 구입 자금 대출입니다.\n- **대상**: 부부합산 연소득 6천만원 이하 (생애최초 등은 8.5천만원)\n- **금리**: 연 2% ~ 3%대 수준\n- **한도**: 최대 2.5억 ~ 4억원 (자녀 수 등에 따라 차등)";
        }
        if (query.includes('버팀목') || query.includes('전세')) {
            return "🏢 **버팀목 전세자금 대출**은 근로자 및 서민의 주거안정을 위한 전세자금 지원 상품입니다.\n- **대상**: 부부합산 연소득 5천만원 이하 무주택자\n- **특징**: 신혼부부나 청년은 전용 상품을 통해 더 높은 한도와 우대 금리를 적용받을 수 있습니다.";
        }
        if (query.includes('LTV') || query.includes('DSR')) {
            return "🔍 **대출 규제 용어 설명**\n- **LTV**: 주택담보대출비율. 집값 대비 대출 가능 금액입니다.\n- **DSR**: 총부채원리금상환비율. 연소득 대비 전체 대출 원리금 상환액 비중을 뜻합니다. 한국에서는 현재 40% 규제가 적용되는 경우가 많습니다.";
        }
        if (query.includes('개인사업자')) {
            return "💼 **개인사업자 대출**은 사업 운영 자금이나 시설 자금을 지원하는 상품입니다.\n- **특징**: 사업자 등록증이 필요하며, 매출 실적이나 신용도에 따라 한도가 결정됩니다. 소상공인진흥공단의 정책 자금도 확인해보시는 것을 추천합니다.";
        }
        if (query.includes('법인')) {
            return "🏢 **법인 대출**은 법인 기업의 운영 및 투자를 위한 금융 지원입니다.\n- **특징**: 재무제표, 사업계획서 등 상세 증빙 서류가 필요하며, 기술보증기금이나 신용보증기금의 보증서를 연계하는 경우가 많습니다.";
        }
        return "질문하신 내용에 대해 분석 중입니다. 더 구체적으로 '신혼부부 전세대출'이나 '아파트 담보대출 한도' 등에 대해 물어봐 주시면 상세히 답변해 드릴게요!";
    }

    // --- Calculator Logic ---
    calcBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('loanAmount').value) * 10000;
        const rate = parseFloat(document.getElementById('loanRate').value) / 100 / 12;
        const term = parseFloat(document.getElementById('loanTerm').value) * 12;
        const method = document.getElementById('repayMethod').value;

        if (isNaN(amount) || isNaN(rate) || isNaN(term)) return;

        let monthlyPayment = 0;
        let totalInterest = 0;

        if (method === 'level') {
            // 원리금 균등 상환
            monthlyPayment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
            totalInterest = (monthlyPayment * term) - amount;
        } else {
            // 원금 균등 상환 (첫 달 기준 평균치 근사)
            const monthlyPrincipal = amount / term;
            let currentBalance = amount;
            for (let i = 0; i < term; i++) {
                totalInterest += currentBalance * rate;
                currentBalance -= monthlyPrincipal;
            }
            monthlyPayment = (amount + totalInterest) / term;
        }

        document.getElementById('monthlyPayment').textContent = Math.round(monthlyPayment).toLocaleString() + '원';
        document.getElementById('totalInterest').textContent = Math.round(totalInterest).toLocaleString() + '원';
        document.getElementById('calcResult').style.display = 'flex';
    });
});
