let display = document.getElementById('display');
let memoryValue = 0;
let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

/* ============ Пинҳон/пайдо кардани калкулятор ============ */
function toggleView() {
    let calc = document.getElementById('calcBox');
    calc.style.display = (calc.style.display === 'none') ? 'block' : 'none';
}

/* ============ Гузариш байни варақаҳо ============ */
function switchTab(tab) {
    ['calc', 'currency', 'history'].forEach(function(name) {
        let el = document.getElementById(name + 'Tab');
        let btn = document.getElementById('tabBtn-' + name);
        if (el) el.style.display = (name === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', name === tab);
    });
    if (tab === 'history') renderHistory();
}

/* ============ Амалҳои асосии калкулятор ============ */
function appendValue(value) {
    let operators = ['+', '-', '×', '÷'];
    let lastChar = display.value.slice(-1);

    // 1. Агар дар экран "Хатогӣ" бошад, онро пок карда рақами новро менавесад
    if (display.value === 'Хатогӣ') {
        display.value = '';
    }

    // 2. Пешгирӣ аз такрори нуқта (вергул) дар як рақам
    if (value === ',') {
        let parts = display.value.split(/[\+\-\×\÷\(\)]/);
        let currentNum = parts[parts.length - 1];
        
        if (currentNum.includes(',')) return;
        
        if (display.value === '' , operators.includes(lastChar) , lastChar === '(') {
            display.value += '0,';
            return;
        }
    }

    // 3. Агар дар экран танҳо "0" бошад ва рақам пахш кунӣ, 0-ро иваз мекунад
    if (display.value === '0' && !operators.includes(value) && value !== ',') {
        display.value = value;
        return;
    }

    // 4. Иваз кардани аломатҳои паиҳам (+ - × ÷)
    if (operators.includes(lastChar) && operators.includes(value)) {
        display.value = display.value.slice(0, -1) + value;
        return;
    }

    display.value += value;
}

function clearDisplay() {
    display.value = '';
}

function deleteLast() {
    if (display.value === 'Хатогӣ') {
        display.value = '';
        return;
    }
    display.value = display.value.slice(0, -1);
}

function toggleSign() {
    let match = display.value.match(/(-?\d+\.?\d*)$/);
    if (!match) return;
    let num = match[1];
    let newNum = num.startsWith('-') ? num.slice(1) : '-' + num;
    display.value = display.value.slice(0, match.index) + newNum;
}

function toJsExpr(str) {
    return str.replace(/÷/g, '/').replace(/×/g, '*').replace(/,/g, '.');
}

function formatResult(num) {
    if (!isFinite(num) || isNaN(num)) return 'Хатогӣ';
    let rounded = Math.round(num * 1e10) / 1e10;
    return String(rounded).replace('.', ',');
}

/* ============ Амалҳои тригонометрӣ (Sin, Cos) ============ */
function calculateSin() {
    try {
        let val = eval(toJsExpr(display.value));
        if (val === undefined || isNaN(val)) return;
        let rad = val * (Math.PI / 180);
        let result = Math.sin(rad);
        addToHistory('sin(' + display.value + ')', formatResult(result));
        display.value = formatResult(result);
    } catch {
        display.value = 'Хатогӣ';
    }
}

function calculateCos() {
    try {
        let val = eval(toJsExpr(display.value));
        if (val === undefined || isNaN(val)) return;
        let rad = val * (Math.PI / 180);
        let result = Math.cos(rad);
        addToHistory('cos(' + display.value + ')', formatResult(result));
        display.value = formatResult(result);
    } catch {
        display.value = 'Хатогӣ';
    }
}

function applyPercent() {
    try {
        let expr = toJsExpr(display.value);
        if (!expr) return;

        let match = expr.match(/^(.*?)([\+\-\*\/])(\d+\.?\d*)$/);

        if (match) {
            let baseExpr = match[1];
            let operator = match[2];
            let percentNum = parseFloat(match[3]);

            let baseVal = eval(baseExpr);
            let percentVal;
                if (operator === '+' || operator === '-') {
                percentVal = (baseVal * percentNum) / 100;
            } else {
                percentVal = percentNum / 100;
            }

            let finalExpr = baseExpr + operator + percentVal;
            let result = eval(finalExpr);
            display.value = formatResult(result);
        } else {
            let num = eval(expr);
            display.value = formatResult(num / 100);
        }
    } catch {
        display.value = 'Хатогӣ';
    }
}

function squareRoot() {
    try {
        let num = eval(toJsExpr(display.value));
        if (num < 0) { display.value = 'Хатогӣ'; return; }
        display.value = formatResult(Math.sqrt(num));
    } catch {
        display.value = 'Хатогӣ';
    }
}

function square() {
    try {
        let num = eval(toJsExpr(display.value));
        display.value = formatResult(num * num);
    } catch {
        display.value = 'Хатогӣ';
    }
}

function calculate() {
    try {
        let rawExpr = display.value;
        if (!rawExpr.trim()) return;
        let result = eval(toJsExpr(rawExpr));
        let formatted = formatResult(result);
        if (formatted !== 'Хатогӣ') {
            addToHistory(rawExpr, formatted);
        }
        display.value = formatted;
    } catch {
        display.value = 'Хатогӣ';
    }
}

/* ============ Хотира (M+, M-, MR, MC) ============ */
function memoryAdd() {
    try { memoryValue += eval(toJsExpr(display.value)) || 0; } catch {}
}
function memorySub() {
    try { memoryValue -= eval(toJsExpr(display.value)) || 0; } catch {}
}
function memoryRecall() {
    display.value = formatResult(memoryValue);
}
function memoryClear() {
    memoryValue = 0;
}

/* ============ Таърихи ҳисобҳо ============ */
function addToHistory(expr, result) {
    history.unshift({ 
        expr: expr, 
        result: result, 
        time: new Date().toLocaleTimeString('tg-TJ', {hour: '2-digit', minute:'2-digit'}) 
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(history));
}

function renderHistory() {
    let list = document.getElementById('historyList');
    if (!list) return;
    if (history.length === 0) {
        list.innerHTML = '<div class="history-empty">Таърих холист</div>';
        return;
    }
    list.innerHTML = history.map(function(h, i) {
        return '<div class="history-item" onclick="reuseHistory(' + i + ')">' +
               '<div class="expr">' + h.expr + ' = <span class="res">' + h.result + '</span></div>' +
               '</div>';
    }).join('');
}

function reuseHistory(index) {
    display.value = history[index].result;
    switchTab('calc');
}

function clearHistory() {
    history = [];
    localStorage.setItem('calcHistory', '[]');
    renderHistory();
}

/* ============ Мубодилаи асъор ============ */
const fallbackRatesToUSD = {
    USD: 1,
    TJS: 1 / 9.2561,
    EUR: 1.08,
    RUB: 1 / 80,
    CNY: 1 / 7.2,
    GBP: 1.27
};
const currencyNames = {
    TJS: 'Сомонӣ (TJS)',
    USD: 'ИМА (USD)',
    EUR: 'Евро (EUR)',
    RUB: 'Русия (RUB)',
    CNY: 'Чин (CNY)',
    GBP: 'Британия (GBP)'
};
let liveRates = null;

function initCurrencySelectors() {
    let from = document.getElementById('fromCurrency');
    let to = document.getElementById('toCurrency');
    if (!from || !to) return;
    
    from.innerHTML = '';
    to.innerHTML = '';
    
    Object.keys(currencyNames).forEach(function(code) {
        from.innerHTML += '<option value="' + code + '">' + currencyNames[code] + '</option>';
        to.innerHTML += '<option value="' + code + '">' + currencyNames[code] + '</option>';
    });
    from.value = 'USD';
    to.value = 'TJS';
    fetchLiveRates();
}

function fetchLiveRates() {
    let statusEl = document.getElementById('currencyStatus');
         if (statusEl) statusEl.textContent = 'Гирифтани қурби рӯз...';
    
    fetch('https://open.er-api.com/v6/latest/USD')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.rates) {
                liveRates = data.rates;
                if (statusEl) statusEl.textContent = 'Қурби зинда фаъол аст';
            } else {
                throw new Error('no rates');
            }
        })
        .catch(function() {
            liveRates = null;
            if (statusEl) statusEl.textContent = 'Бе интернет — қурби тахминӣ истифода мешавад';
        });
}

function swapCurrency() {
    let from = document.getElementById('fromCurrency');
    let to = document.getElementById('toCurrency');
    if (!from || !to) return;
    
    let tmp = from.value;
    from.value = to.value;
    to.value = tmp;
    convertCurrency();
}

function convertCurrency() {
    let amountInput = document.getElementById('amountInput');
    let currencyResult = document.getElementById('currencyResult');
    if (!amountInput || !currencyResult) return;

    let amount = parseFloat(amountInput.value) || 0;
    let fromCode = document.getElementById('fromCurrency').value;
    let toCode = document.getElementById('toCurrency').value;
    let rates = liveRates || fallbackRatesToUSD;

    let fromRate = rates[fromCode];
    let toRate = rates[toCode];
    if (!fromRate || !toRate) {
        currencyResult.textContent = 'Хатогӣ';
        return;
    }

    let inUsd = liveRates ? (amount / fromRate) : (amount * fromRate);
    let result = liveRates ? (inUsd * toRate) : (inUsd / toRate);

    currencyResult.textContent = formatResult(result) + ' ' + toCode;
}

/* ============ Дастгирии клавиатура ============ */
document.addEventListener('keydown', function(e) {
    let calcTab = document.getElementById('calcTab');
    if (calcTab && calcTab.style.display === 'none') return;

    if (e.key >= '0' && e.key <= '9') appendValue(e.key);
    else if (e.key === '.' || e.key === ',') appendValue(',');
    else if (e.key === '+') appendValue('+');
    else if (e.key === '-') appendValue('-');
    else if (e.key === '*') appendValue('×');
    else if (e.key === '/') { e.preventDefault(); appendValue('÷'); }
    else if (e.key === '(' || e.key === ')') appendValue(e.key);
    else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculate(); }
    else if (e.key === 'Backspace') deleteLast();
    else if (e.key === 'Escape') clearDisplay();
    else if (e.key === '%') applyPercent();
});

/* ============ Оғоз ============ */
initCurrencySelectors();