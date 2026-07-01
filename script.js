// ===== CONFIG =====
const SUPABASE_URL = 'https://egioyhrdbmhvmblgwvpi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_23t3IDTe7sOuP4wee1q0IA_1tvjDxD1';

// ===== MATRIX RAIN =====
const canvas = document.getElementById('matrix-rain');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
const fontSize = 14;
let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

window.addEventListener('resize', () => {
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
});

// ===== TYPEWRITER =====
const typewriterEl = document.getElementById('typewriter');
const phrases = [
    'Transformo ideias em soluções digitais',
    'Automações inteligentes para seu negócio',
    'Desenvolvimento Web sob medida',
    'Inteligência Artificial aplicada'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typewrite() {
    const current = phrases[phraseIndex];

    if (!isDeleting) {
        typewriterEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
            isDeleting = true;
            setTimeout(typewrite, 2000);
            return;
        }
        setTimeout(typewrite, 60);
    } else {
        typewriterEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(typewrite, 400);
            return;
        }
        setTimeout(typewrite, 30);
    }
}

typewrite();

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== MOBILE MENU =====
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ===== STAT COUNTERS =====
function animateCounters() {
    document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 1500;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            statsObserver.unobserve(statsSection);
        }
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
}

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), index * 100);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// ===== CHAT IA =====
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

function addChatMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${type}`;
    const label = type === 'user' ? '[VOCÊ]' : '[IA]';
    msg.innerHTML = `<span class="msg-label">${label}</span><span class="msg-text">${text}</span>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
}

async function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    addChatMessage(text, 'user');

    const loadingMsg = addChatMessage('Processando...', 'bot loading');

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-groq`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();
        loadingMsg.remove();
        addChatMessage(data.response || data.error || 'Erro ao processar resposta.', 'bot');
    } catch (err) {
        loadingMsg.remove();
        addChatMessage('Erro de conexão. Tente novamente.', 'bot');
    }
}

chatSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
});

// ===== BOOKING FORM =====
const bookingForm = document.getElementById('booking-form');
const bookingFeedback = document.getElementById('booking-feedback');

// Set min date to today
const dateInput = document.getElementById('book-date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
}

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('booking-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-bracket">[</span> ENVIANDO... <span class="btn-bracket">]</span>';
    bookingFeedback.textContent = '';
    bookingFeedback.className = 'booking-feedback';

    const formData = {
        nome: document.getElementById('book-name').value.trim(),
        email: document.getElementById('book-email').value.trim(),
        telefone: document.getElementById('book-phone').value.trim(),
        servico: document.getElementById('book-service').value,
        data: document.getElementById('book-date').value,
        horario: document.getElementById('book-time').value,
        mensagem: document.getElementById('book-msg').value.trim()
    };

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/agendamento`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (res.ok) {
            bookingFeedback.textContent = '[OK] Consultoria agendada com sucesso! Entrarei em contato em breve.';
            bookingFeedback.className = 'booking-feedback success';
            bookingForm.reset();
        } else {
            bookingFeedback.textContent = `[ERRO] ${data.error || 'Erro ao agendar.'}`;
            bookingFeedback.className = 'booking-feedback error';
        }
    } catch (err) {
        bookingFeedback.textContent = '[ERRO] Falha de conexão. Tente pelo WhatsApp.';
        bookingFeedback.className = 'booking-feedback error';
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-bracket">[</span> AGENDAR CONSULTORIA <span class="btn-bracket">]</span>';
});

// ===== ANALYTICS =====
(async function trackPageView() {
    try {
        await fetch(`${SUPABASE_URL}/functions/v1/analytics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                event: 'page_view',
                path: location.pathname,
                referrer: document.referrer,
                user_agent: navigator.userAgent
            })
        });
    } catch (e) {
        // silent fail
    }
})();
