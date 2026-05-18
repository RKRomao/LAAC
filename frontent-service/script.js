// Initialize Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.onscroll = () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
};

// Initialize Swiper Carousel
let swiper;
async function initNews() {
    const wrapper = document.getElementById('news-wrapper');
    try {
        const response = await fetch('/api/news');
        if (response.ok) {
            const news = await response.json();
            news.forEach(item => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide carousel-slide';
                slide.innerHTML = `
                    <img src="${item.image}" alt="${item.title}" class="slide-bg">
                    <div class="slide-content">
                        <h1>${item.title}</h1>
                        <p>${item.summary}</p>
                        <button class="btn-emergency">Ler Mais <i class="fa-solid fa-plus"></i></button>
                    </div>
                `;
                wrapper.appendChild(slide);
            });
        }
    } catch (error) {
        console.error('Error fetching news:', error);
    } finally {
        // Initialize Swiper regardless of news success
        swiper = new Swiper(".mySwiper", {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            effect: "fade",
            fadeEffect: {
                crossFade: true
            },
            observer: true,
            observeParents: true
        });
    }
}

// Initialize Leaflet Map
let map;
function initMap() {
    // UBI Covilhã coordinates
    const ubiCoords = [40.281, -7.505];
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView(ubiCoords, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Initial marker
    L.marker(ubiCoords).addTo(map)
        .bindPopup('UBI - Polo IV')
        .openPopup();
}

function focusMap(lat, lng, name) {
    map.setView([lat, lng], 17);
    L.marker([lat, lng]).addTo(map)
        .bindPopup(name)
        .openPopup();
}

// Emergency Chat and SOS Logic moved to dedicated section below

function makeCall() {
    alert('A iniciar chamada VoIP para a equipa de emergência...');
}

// User Auth Logic
function checkLoginState() {
    const token = localStorage.getItem('laac_token');
    let role = localStorage.getItem('laac_role');
    const dropdown = document.getElementById('user-dropdown');
    
    // Only clear if explicitly corrupted with the string "undefined"
    if (token && role === "undefined") {
        console.warn("DEBUG: Corrupted role string detected, fixing...");
        localStorage.removeItem('laac_role');
        role = null; // Continue as normal user
    }

    console.log("DEBUG: checkLoginState triggered. Token exists:", !!token, "Role:", role);
    
    if (token) {
        // Default to 'aluno' if role is missing but token is valid
        const currentRole = role || 'aluno';
        const staffDashboardLink = (currentRole === 'admin' || currentRole.startsWith('LAAC-staff')) ? `
            <a href="staff-dashboard.html" class="dropdown-item">
                <i class="fa-solid fa-gauge-high"></i> Dashboard Staff
            </a>` : '';
        const isAdmin = currentRole === 'admin';
        
        const adminLink = isAdmin ? `
            <a href="admin.html" class="dropdown-item">
                <i class="fa-solid fa-gauge-high"></i> Painel Admin
            </a>
            <a href="staff-tickets.html" class="dropdown-item">
                <i class="fa-solid fa-ticket"></i> Gestão de Tickets
            </a>` : '';

        
        dropdown.innerHTML = `
            <a href="profile.html" class="dropdown-item"><i class="fa-solid fa-circle-user"></i> Perfil</a>
            ${staffDashboardLink}
            ${adminLink}
            <div class="dropdown-item"><i class="fa-solid fa-gear"></i> Definições</div>
            <hr style="opacity: 0.1; margin: 0.5rem 0;">
            <div class="dropdown-item logout" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Sair</div>
        `;
    } else {
        dropdown.innerHTML = `
            <div class="dropdown-item" onclick="window.location.href='login.html'"><i class="fa-solid fa-right-to-bracket"></i> Login</div>
            <div class="dropdown-item" onclick="window.location.href='login.html'"><i class="fa-solid fa-user-plus"></i> Registar</div>
        `;
    }
}

function toggleUserDropdown() {
    document.getElementById('user-dropdown').classList.toggle('active');
}

// Profile Functions
async function toggleProfile() {
    const modal = document.getElementById('profile-modal');
    const isVisible = modal.style.display === 'flex';
    
    if (!isVisible) {
        // Load data before showing
        const email = localStorage.getItem('laac_user_email');
        if (!email) return;
        
        try {
            const response = await fetch(`/api/profiles/${email}`);
            const profile = await response.json();
            
            document.getElementById('profile-email').value = profile.email;
            document.getElementById('profile-name').value = profile.display_name || '';
            document.getElementById('profile-course').value = profile.course || '';
            document.getElementById('profile-year').value = profile.year || 1;
            document.getElementById('profile-avatar-url').value = profile.avatar_url || '';
            document.getElementById('profile-avatar-preview').src = profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.display_name}`;
            document.getElementById('profile-bio').value = profile.bio || '';
            
            modal.style.display = 'flex';
        } catch (e) {
            alert('Erro ao carregar perfil.');
        }
    } else {
        modal.style.display = 'none';
    }
}

async function saveProfile() {
    const data = {
        email: document.getElementById('profile-email').value,
        display_name: document.getElementById('profile-name').value,
        course: document.getElementById('profile-course').value,
        year: parseInt(document.getElementById('profile-year').value),
        avatar_url: document.getElementById('profile-avatar-url').value,
        bio: document.getElementById('profile-bio').value,
        social_links: {}
    };

    try {
        const response = await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Perfil atualizado com sucesso!');
            toggleProfile();
        }
    } catch (e) {
        alert('Erro ao guardar perfil.');
    }
}

function logout() {
    localStorage.removeItem('laac_token');
    localStorage.removeItem('laac_role');
    window.location.reload();
}

// Close dropdowns when clicking outside
window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-action')) {
        document.getElementById('user-dropdown').classList.remove('active');
    }
});

// Fetch FAQs
let allFaqs = [];
let showingAllFaqs = false;

async function fetchFAQs() {
    try {
        const response = await fetch('/api/faqs');
        allFaqs = await response.json();
        renderFAQs();
    } catch (error) {
        console.error('Error loading FAQs:', error);
    }
}

function renderFAQs() {
    const container = document.getElementById('faq-container');
    const loadMoreContainer = document.getElementById('faq-load-more-container');
    
    if (!container) return;

    // Show only first 4 if not showing all
    const faqsToRender = showingAllFaqs ? allFaqs : allFaqs.slice(0, 4);
    
    container.innerHTML = faqsToRender.map(faq => `
        <div class="faq-item glass">
            <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
                <div>
                    <span class="faq-category">${faq.category}</span>
                    <h4>${faq.question}</h4>
                </div>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="faq-answer">
                <p>${faq.answer}</p>
            </div>
        </div>
    `).join('');

    // Hide button if all are showing or there are few faqs
    if (loadMoreContainer) {
        loadMoreContainer.style.display = (showingAllFaqs || allFaqs.length <= 4) ? 'none' : 'flex';
    }
}

function loadMoreFAQs() {
    showingAllFaqs = true;
    renderFAQs();
}

// Emergency SOS Logic
function toggleSOS() {
    document.getElementById('sos-menu').classList.toggle('active');
}

let currentIncidentId = null;

async function sendEmergency(type) {
    const userEmail = localStorage.getItem('laac_user_email') || 'anonimo@ubi.pt';

    if (type === 'call') {
        try {
            const response = await fetch('/api/emergency/call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: userEmail })
            });
            const data = await response.json();
            
            if (data.phone) {
                alert(`A ligar para ${data.assigned_responder}...\nNúmero: ${data.phone}`);
            } else {
                alert('A ligar para a Equipa de Resposta...');
            }
        } catch (e) { 
            console.error(e);
            alert('Erro ao iniciar chamada. Tente novamente.');
        }
        return;
    }

    const handleEmergencyWithCoords = async (latitude, longitude) => {
        try {
            const response = await fetch('/api/emergency/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: userEmail,
                    type: type,
                    lat: latitude,
                    lng: longitude
                })
            });

            const result = await response.json();
            currentIncidentId = result.incident_id;
            
            alert(result.message);
            
            // Auto-open chat if it was a silent or chat alert
            if (type !== 'call') {
                const overlay = document.getElementById('chat-overlay');
                if (!overlay.classList.contains('active')) {
                    overlay.classList.add('active');
                }
                startChatPolling();
            }
        } catch (error) {
            console.error('Error sending emergency:', error);
            alert('Erro ao enviar alerta. Tente novamente ou ligue 112.');
        }
    };

    navigator.geolocation.getCurrentPosition(
        (position) => handleEmergencyWithCoords(position.coords.latitude, position.coords.longitude),
        (error) => {
            console.warn("Geolocation failed, sending without coordinates");
            handleEmergencyWithCoords(0, 0); // Fallback to 0,0
            alert('Aviso: Não conseguimos obter a tua localização exata. Por favor, indica o local no chat.');
        }
    );
}

function toggleChat() {
    const overlay = document.getElementById('chat-overlay');
    overlay.classList.toggle('active');
    
    if (overlay.classList.contains('active')) {
        if (!currentIncidentId) {
            sendEmergency('chat');
        } else {
            loadChatMessages();
            startChatPolling();
        }
    }
}

function makeCall() {
    sendEmergency('call');
}

let isSending = false;
async function sendChatMessage() {
    if (isSending) return;
    const input = document.querySelector('.chat-input');
    const message = input.value.trim();
    if (!message || !currentIncidentId) return;

    const userEmail = localStorage.getItem('laac_user_email') || 'anonimo@ubi.pt';
    isSending = true;
    input.value = ''; // Clear immediately for better UX

    try {
        await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                incident_id: currentIncidentId,
                sender_email: userEmail,
                message: message,
                is_responder: false
            })
        });
        loadChatMessages();
    } catch (e) { 
        console.error(e); 
        input.value = message; // Restore on error
    } finally {
        isSending = false;
    }
}

async function loadChatMessages() {
    if (!currentIncidentId) return;
    try {
        const response = await fetch(`/api/chat/messages/${currentIncidentId}`);
        const messages = await response.json();
        const container = document.getElementById('chat-messages');
        
        container.innerHTML = messages.map(msg => `
            <div class="msg ${msg.is_responder ? 'bot' : 'user'}">
                ${msg.message}
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    } catch (e) { console.error(e); }
}

let chatPollingInterval = null;

function startChatPolling() {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(loadChatMessages, 3000);
}

// Event listener for chat input
document.querySelector('.chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

async function pollNotifications() {
    try {
        const response = await fetch('/api/notifications/all');
        const notifications = await response.json();
        
        if (notifications.length > 0) {
            notifications.forEach(notif => {
                if (notif.data && notif.data.type === 'incident_resolved' && notif.data.id == currentIncidentId) {
                    alert("Este incidente foi marcado como RESOLVIDO pela equipa de suporte. O chat será encerrado.");
                    currentIncidentId = null;
                    document.getElementById('chat-overlay').classList.remove('active');
                    if (chatPollingInterval) clearInterval(chatPollingInterval);
                }
            });
        }
    } catch (e) { console.error("Polling error:", e); }
}

function selectReportType(type, element) {
    document.getElementById('report-type').value = type;
    document.querySelectorAll('.report-type-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

async function submitReport() {
    const type = document.getElementById('report-type').value;
    const title = document.getElementById('report-title').value.trim();
    const description = document.getElementById('report-description').value.trim();
    const btn = document.getElementById('btn-submit-report');

    if (!title || !description) {
        alert("Por favor preenche o título e a descrição.");
        return;
    }

    const token = localStorage.getItem('laac_token');
    const originalBtnText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = 'A enviar <span class="loading-dots"></span>';
        
        let url = '/api/tickets';
        let bodyData = { type, title, description };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            btn.innerHTML = 'Sucesso! <i class="fa-solid fa-check"></i>';
            btn.style.background = '#22c55e';
            
            setTimeout(() => {
                document.getElementById('report-title').value = '';
                document.getElementById('report-description').value = '';
                btn.disabled = false;
                btn.innerHTML = originalBtnText;
                btn.style.background = '';
                alert("Report submetido com sucesso! Obrigado pela tua colaboração.");
            }, 2000);
        } else {
            throw new Error('Falha na submissão');
        }
    } catch (error) {
        console.error("Error submitting report:", error);
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
        alert("Erro ao submeter report. Verifica a tua ligação.");
    }
}

// Start everything
document.addEventListener('DOMContentLoaded', () => {
    initNews();
    initMap();
    checkLoginState();
    fetchFAQs();
    setInterval(pollNotifications, 5000);
});
