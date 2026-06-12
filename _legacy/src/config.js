// ========================================
// VAPI Configuration
// ========================================
// Replace these with your actual VAPI credentials from https://dashboard.vapi.ai
export const VAPI_CONFIG = {
  publicKey: '39d768e4-7267-4b02-b93e-6d84b7872d93',  // Get from VAPI Dashboard → Account → Public Key
  assistantId: '41aa45d5-6d3a-4d23-a70e-9d66a7c8868d',
};

// ========================================
// Company Information (for UI display)
// ========================================
export const COMPANY = {
  name: 'Zensar Technologies',
  website: 'https://www.zensar.com/',
  overview:
    'Zensar Technologies is a global technology consulting and digital solutions company headquartered in Pune, India. It helps enterprises transform through experience-led digital solutions across cloud, AI, data, and enterprise applications.',
  philosophy:
    'Experience-led everything — combining experience, engineering, and engagement to create impactful digital solutions.',
  parentCompany: 'RPG Group',
  globalPresence: '30+ global locations with 10,000+ professionals',
  industries: [
    'Banking and Financial Services',
    'Insurance',
    'Healthcare and Life Sciences',
    'Manufacturing',
    'Technology, Media, and Telecom',
    'Consumer Services',
  ],
  services: [
    'Application Services',
    'Artificial Intelligence Solutions',
    'Cloud, Infrastructure, and Security',
    'Data Engineering and Analytics',
    'Marketing and Digital Engagement',
    'Digital Workplace Services',
  ],
};

// ========================================
// FAQ Data (for display in the UI)
// ========================================
export const FAQS = [
  {
    question: 'What does Zensar do?',
    answer:
      'Zensar Technologies is a digital transformation and technology services company that helps enterprises modernize systems using AI, cloud computing, data analytics, and enterprise applications.',
  },
  {
    question: 'Where is Zensar located?',
    answer:
      'Zensar is headquartered in Pune, India, and operates in more than 30 global locations across North America, Europe, Africa, and Asia-Pacific.',
  },
  {
    question: 'What industries does Zensar serve?',
    answer:
      'Zensar works with industries including banking, insurance, healthcare, manufacturing, telecommunications, technology, and consumer services.',
  },
  {
    question: 'What is the work culture like at Zensar?',
    answer:
      'Zensar promotes a people-first culture focused on collaboration, innovation, continuous learning, and employee well-being.',
  },
  {
    question: 'What technologies does Zensar work with?',
    answer:
      'Zensar works with modern technologies including cloud platforms, artificial intelligence, data analytics, enterprise applications, digital experience platforms, and automation tools.',
  },
];

// ========================================
// Conversation Flow Steps (for UI display)
// ========================================
export const CONVERSATION_STEPS = [
  { step: 'collect_name', label: 'Full Name', icon: '👤' },
  { step: 'collect_phone', label: 'Phone Number', icon: '📱' },
  { step: 'collect_email', label: 'Email Address', icon: '✉️' },
  { step: 'confirm_interest', label: 'Interest Area', icon: '💼' },
  { step: 'company_info', label: 'Company Overview', icon: '🏢' },
  { step: 'schedule_interview', label: 'Schedule Interview', icon: '📅' },
  { step: 'confirmation', label: 'Confirmation', icon: '✅' },
];
