// ========================================
// Zensar Recruitment Assistant — Main Application
// ========================================
import Vapi from '@vapi-ai/web';
import { VAPI_CONFIG, COMPANY, FAQS, CONVERSATION_STEPS } from './config.js';
import './style.css';

// --- DOM Elements ---
const callButton = document.getElementById('callButton');
const muteButton = document.getElementById('muteButton');
const callLabel = document.getElementById('callLabel');
const callTimer = document.getElementById('callTimer');
const voiceCard = document.getElementById('voiceCard');
const transcript = document.getElementById('transcript');
const transcriptBadge = document.getElementById('transcriptBadge');
const connectionStatus = document.getElementById('connectionStatus');
const conversationSteps = document.getElementById('conversationSteps');
const companyOverview = document.getElementById('companyOverview');
const servicesCloud = document.getElementById('servicesCloud');
const industriesCloud = document.getElementById('industriesCloud');
const faqList = document.getElementById('faqList');

// --- State ---
let vapi = null;
let isCallActive = false;
let isMuted = false;
let callStartTime = null;
let timerInterval = null;
let currentStepIndex = -1;

// ========================================
// Initialize VAPI
// ========================================
function initVapi() {
  try {
    vapi = new Vapi(VAPI_CONFIG.publicKey);
    setupVapiEvents();
    console.log('✅ VAPI SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize VAPI:', error);
    callLabel.textContent = 'Failed to initialize voice SDK';
  }
}

// ========================================
// VAPI Event Handlers
// ========================================
function setupVapiEvents() {
  vapi.on('call-start', () => {
    console.log('📞 Call started');
    setCallState('active');
    startTimer();
    addTranscriptMessage(
      'assistant',
      'Connected! The recruitment assistant is ready to help you.'
    );
  });

  vapi.on('call-end', () => {
    console.log('📞 Call ended');
    setCallState('idle');
    stopTimer();
    addTranscriptMessage('system', 'Call ended. Thank you for speaking with us!');
  });

  vapi.on('message', (message) => {
    handleVapiMessage(message);
  });

  vapi.on('speech-start', () => {
    animateVisualizer(true);
  });

  vapi.on('speech-end', () => {
    animateVisualizer(false);
  });

  vapi.on('volume-level', (level) => {
    updateVisualizerLevel(level);
  });

  vapi.on('error', (error) => {
    console.error('❌ VAPI Error:', error);
    setCallState('idle');
    stopTimer();
    addTranscriptMessage(
      'system',
      'An error occurred. Please try again.'
    );
  });
}

// ========================================
// Message Handler
// ========================================
function handleVapiMessage(message) {
  switch (message.type) {
    case 'transcript':
      if (message.transcriptType === 'final') {
        addTranscriptMessage(message.role, message.transcript);
        detectConversationStep(message.transcript, message.role);
      }
      break;

    case 'function-call':
      console.log('📦 Function call:', message);
      break;

    case 'hang':
      console.log('👋 Assistant ended the call');
      break;

    default:
      break;
  }
}

// ========================================
// Call Controls
// ========================================
async function startCall() {
  if (!vapi) {
    console.error('VAPI not initialized');
    return;
  }

  try {
    setCallState('connecting');
    clearTranscript();

    await vapi.start(VAPI_CONFIG.assistantId);
  } catch (error) {
    console.error('❌ Failed to start call:', error);
    setCallState('idle');
    addTranscriptMessage('system', `Failed to connect: ${error.message}`);
  }
}

function endCall() {
  if (vapi) {
    vapi.stop();
  }
  setCallState('idle');
  stopTimer();
}

function toggleMute() {
  if (!vapi || !isCallActive) return;

  isMuted = !isMuted;
  vapi.setMuted(isMuted);

  muteButton.classList.toggle('muted', isMuted);
  muteButton.setAttribute(
    'aria-label',
    isMuted ? 'Unmute microphone' : 'Mute microphone'
  );
}

// ========================================
// UI State Management
// ========================================
function setCallState(state) {
  // Reset classes
  voiceCard.classList.remove('active', 'connecting');
  callButton.classList.remove('active', 'connecting');
  connectionStatus.classList.remove('active', 'connecting');
  transcriptBadge.classList.remove('active');

  switch (state) {
    case 'connecting':
      isCallActive = false;
      voiceCard.classList.add('connecting');
      callButton.classList.add('connecting');
      connectionStatus.classList.add('connecting');
      callLabel.textContent = 'Connecting...';
      connectionStatus.querySelector('.status-text').textContent = 'Connecting';
      muteButton.disabled = true;
      break;

    case 'active':
      isCallActive = true;
      voiceCard.classList.add('active');
      callButton.classList.add('active');
      connectionStatus.classList.add('active');
      transcriptBadge.classList.add('active');
      callLabel.textContent = 'Call in progress — speak freely';
      connectionStatus.querySelector('.status-text').textContent = 'In Call';
      muteButton.disabled = false;
      break;

    case 'idle':
    default:
      isCallActive = false;
      isMuted = false;
      callLabel.textContent = 'Click to start a conversation';
      connectionStatus.querySelector('.status-text').textContent = 'Ready';
      muteButton.disabled = true;
      muteButton.classList.remove('muted');
      currentStepIndex = -1;
      resetSteps();
      break;
  }
}

// ========================================
// Timer
// ========================================
function startTimer() {
  callStartTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  callTimer.textContent = '00:00';
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');
  callTimer.textContent = `${minutes}:${seconds}`;
}

// ========================================
// Transcript
// ========================================
function addTranscriptMessage(role, text) {
  // Remove empty state if present
  const emptyState = transcript.querySelector('.transcript__empty');
  if (emptyState) emptyState.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `transcript__message transcript__message--${role}`;

  const isAssistant = role === 'assistant';
  const isUser = role === 'user';

  let avatarClass = '';
  let avatarText = '';
  let roleText = '';

  if (isAssistant) {
    avatarClass = 'transcript__avatar--assistant';
    avatarText = 'ZR';
    roleText = 'Zensar Assistant';
  } else if (isUser) {
    avatarClass = 'transcript__avatar--user';
    avatarText = 'You';
    roleText = 'You';
  } else {
    avatarClass = 'transcript__avatar--assistant';
    avatarText = '⚙';
    roleText = 'System';
  }

  messageDiv.innerHTML = `
    <div class="transcript__avatar ${avatarClass}">${avatarText}</div>
    <div class="transcript__bubble">
      <p class="transcript__role">${roleText}</p>
      <p class="transcript__text">${escapeHtml(text)}</p>
    </div>
  `;

  transcript.appendChild(messageDiv);
  transcript.scrollTop = transcript.scrollHeight;
}

function clearTranscript() {
  transcript.innerHTML = '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// Audio Visualizer
// ========================================
function animateVisualizer(active) {
  const bars = document.querySelectorAll('.visualizer__bar');
  bars.forEach((bar) => {
    if (active) {
      bar.style.animationPlayState = 'running';
    } else {
      bar.style.animationPlayState = 'paused';
    }
  });
}

function updateVisualizerLevel(level) {
  const bars = document.querySelectorAll('.visualizer__bar');
  const normalizedLevel = Math.min(1, Math.max(0, level));

  bars.forEach((bar, index) => {
    const distance = Math.abs(index - bars.length / 2) / (bars.length / 2);
    const height = 8 + normalizedLevel * (1 - distance * 0.5) * 50;
    bar.style.height = `${height}px`;
  });
}

// ========================================
// Conversation Step Detection (heuristic)
// ========================================
function detectConversationStep(text, role) {
  if (role !== 'assistant') return;
  const lowerText = text.toLowerCase();

  const stepKeywords = [
    { keywords: ['your name', 'full name', 'may i know your name'], step: 0 },
    { keywords: ['phone number', 'phone', 'contact number', 'reach you'], step: 1 },
    { keywords: ['email', 'email address'], step: 2 },
    { keywords: ['application', 'opportunities', 'interest', 'calling regarding'], step: 3 },
    { keywords: ['zensar is', 'zensar technologies', 'about zensar', 'our company'], step: 4 },
    { keywords: ['schedule', 'interview', 'assessment', 'preferred date', 'preferred time'], step: 5 },
    { keywords: ['scheduled', 'confirmation', 'confirmed', 'confirmation email'], step: 6 },
  ];

  for (const { keywords, step } of stepKeywords) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      if (step > currentStepIndex) {
        setActiveStep(step);
        break;
      }
    }
  }
}

function setActiveStep(index) {
  currentStepIndex = index;
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach((item, i) => {
    item.classList.remove('active', 'completed');
    if (i < index) item.classList.add('completed');
    if (i === index) item.classList.add('active');
  });
}

function resetSteps() {
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach((item) => {
    item.classList.remove('active', 'completed');
  });
}

// ========================================
// Populate UI
// ========================================
function populateConversationSteps() {
  conversationSteps.innerHTML = CONVERSATION_STEPS.map(
    (step, i) => `
    <div class="step-item" data-step="${step.step}">
      <span class="step-item__icon">${step.icon}</span>
      <span class="step-item__label">${step.label}</span>
      <span class="step-item__number">${String(i + 1).padStart(2, '0')}</span>
    </div>
  `
  ).join('');
}

function populateCompanyInfo() {
  companyOverview.textContent = COMPANY.overview;

  servicesCloud.innerHTML = COMPANY.services
    .map((s) => `<span class="tag">${s}</span>`)
    .join('');

  industriesCloud.innerHTML = COMPANY.industries
    .map((ind) => `<span class="tag">${ind}</span>`)
    .join('');
}

function populateFAQs() {
  faqList.innerHTML = FAQS.map(
    (faq, i) => `
    <div class="faq-item" id="faqItem${i}">
      <button class="faq-item__question" onclick="toggleFaq(${i})" aria-expanded="false">
        ${escapeHtml(faq.question)}
        <svg class="faq-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div class="faq-item__answer">
        <p class="faq-item__answer-inner">${escapeHtml(faq.answer)}</p>
      </div>
    </div>
  `
  ).join('');
}

// FAQ toggle (global for onclick)
window.toggleFaq = function (index) {
  const item = document.getElementById(`faqItem${index}`);
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item').forEach((el) => {
    el.classList.remove('open');
    el.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
  });

  // Toggle current
  if (!isOpen) {
    item.classList.add('open');
    item.querySelector('.faq-item__question').setAttribute('aria-expanded', 'true');
  }
};

// ========================================
// Event Listeners
// ========================================
callButton.addEventListener('click', () => {
  if (isCallActive) {
    endCall();
  } else {
    startCall();
  }
});

muteButton.addEventListener('click', toggleMute);

// ========================================
// Initialize
// ========================================
function init() {
  populateConversationSteps();
  populateCompanyInfo();
  populateFAQs();
  initVapi();

  // Remove default Vite content
  const defaultApp = document.getElementById('app');
  if (defaultApp) defaultApp.remove();
}

document.addEventListener('DOMContentLoaded', init);

// Also run if DOM already loaded (module scripts are deferred)
if (document.readyState !== 'loading') {
  init();
}
