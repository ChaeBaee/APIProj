// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuButton?.contains(e.target) && !mobileMenu?.contains(e.target)) {
            mobileMenu?.classList.add('hidden');
        }
    });

    // Handle contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Handle booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        initializeBookingForm();
    }

    // Initialize gallery if on gallery page
    if (document.querySelector('.gallery-item')) {
        initializeGallery();
    }

    // Initialize smooth scrolling
    initializeSmoothScrolling();

    // Initialize animations
    initializeAnimations();

    // Initialize APIs
    initializeWeatherWidget();
    initializeCurrencyConverter();
    initializeNewsFeed();

    // Initialize accessibility features
    initializeAccessibility();
    initializeKeyboardShortcuts();
    
    // Add screen reader announcements for dynamic content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = node.textContent;
                        if (text && text.length < 100) {
                            announceToScreenReader(text);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// API Base URLs
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const CURRENCY_API = 'https://api.exchangerate.host/latest';
const NEWS_API = 'https://api.spaceflightnewsapi.net/v4/articles';

// Form Validation Utilities
const validators = {
    email: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email) ? null : 'Please enter a valid email address';
    },
    phone: (phone) => {
        const regex = /^\+?[\d\s-]{10,}$/;
        return regex.test(phone) ? null : 'Please enter a valid phone number';
    },
    name: (name) => {
        return name.length >= 2 ? null : 'Name must be at least 2 characters long';
    },
    date: (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        return selectedDate >= today ? null : 'Date must be in the future';
    },
    required: (value) => {
        return value.trim() ? null : 'This field is required';
    }
};

// Form Error Handler
function handleFormError(form, error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1';
    errorDiv.textContent = error;
    form.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Input Validation Handler
function validateInput(input, rules) {
    const errors = [];
    rules.forEach(rule => {
        const error = validators[rule](input.value);
        if (error) errors.push(error);
    });
    return errors;
}

// Update Contact Form Handler
function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    // Clear previous errors
    form.querySelectorAll('.text-red-500').forEach(el => el.remove());

    // Validate all fields
    const nameErrors = validateInput(name, ['required', 'name']);
    const emailErrors = validateInput(email, ['required', 'email']);
    const subjectErrors = validateInput(subject, ['required']);
    const messageErrors = validateInput(message, ['required']);

    if ([...nameErrors, ...emailErrors, ...subjectErrors, ...messageErrors].length > 0) {
        nameErrors.forEach(error => handleFormError(name.parentElement, error));
        emailErrors.forEach(error => handleFormError(email.parentElement, error));
        subjectErrors.forEach(error => handleFormError(subject.parentElement, error));
        messageErrors.forEach(error => handleFormError(message.parentElement, error));
        return;
    }

    // Add loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    submitButton.disabled = true;

    // Collect form data
    const formData = {
        name: name.value,
        email: email.value,
        subject: subject.value,
        message: message.value
    };

    // Send form data to API
    fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    })
    .then(data => {
        showNotification('Thank you for your message! We will get back to you soon.', 'success');
        e.target.reset();
    })
    .catch(error => {
        showNotification('Failed to send message. Please try again.', 'error');
    })
    .finally(() => {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    });
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Booking Form Functionality
function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const roomOptions = document.querySelectorAll('.room-option');
    const roomRateElement = document.getElementById('roomRate');
    const nightsElement = document.getElementById('nights');
    const totalPriceElement = document.getElementById('totalPrice');

    let selectedRoom = null;

    // Set minimum date for check-in to today
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;

    // Update check-out minimum date when check-in is selected
    checkInInput.addEventListener('change', () => {
        checkOutInput.min = checkInInput.value;
        if (checkOutInput.value && checkOutInput.value < checkInInput.value) {
            checkOutInput.value = checkInInput.value;
        }
        updatePrice();
    });

    // Update price when check-out date changes
    checkOutInput.addEventListener('change', updatePrice);

    // Room selection
    roomOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            roomOptions.forEach(opt => opt.classList.remove('border-blue-500'));
            // Add selected class to clicked option
            option.classList.add('border-blue-500');
            // Update selected room
            selectedRoom = option;
            updatePrice();
        });
    });

    // Calculate and update price
    function updatePrice() {
        if (!selectedRoom || !checkInInput.value || !checkOutInput.value) return;

        const price = parseFloat(selectedRoom.dataset.price);
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        if (nights < 1) {
            showNotification('Check-out date must be after check-in date', 'error');
            return;
        }

        roomRateElement.textContent = `$${price}`;
        nightsElement.textContent = nights;
        totalPriceElement.textContent = `$${price * nights}`;
    }

    // Add validation to booking form
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        bookingForm.querySelectorAll('.text-red-500').forEach(el => el.remove());

        // Validate all fields
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const checkIn = document.getElementById('checkIn');
        const checkOut = document.getElementById('checkOut');

        const nameErrors = validateInput(name, ['required', 'name']);
        const emailErrors = validateInput(email, ['required', 'email']);
        const checkInErrors = validateInput(checkIn, ['required', 'date']);
        const checkOutErrors = validateInput(checkOut, ['required', 'date']);

        if ([...nameErrors, ...emailErrors, ...checkInErrors, ...checkOutErrors].length > 0) {
            nameErrors.forEach(error => handleFormError(name.parentElement, error));
            emailErrors.forEach(error => handleFormError(email.parentElement, error));
            checkInErrors.forEach(error => handleFormError(checkIn.parentElement, error));
            checkOutErrors.forEach(error => handleFormError(checkOut.parentElement, error));
            return;
        }

        // Validate check-out is after check-in
        const checkInDate = new Date(checkIn.value);
        const checkOutDate = new Date(checkOut.value);
        if (checkOutDate <= checkInDate) {
            handleFormError(checkOut.parentElement, 'Check-out date must be after check-in date');
            return;
        }

        if (!selectedRoom) {
            showNotification('Please select a room', 'error');
            return;
        }

        const submitButton = bookingForm.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {
            const formData = {
                checkIn: checkIn.value,
                checkOut: checkOut.value,
                roomType: selectedRoom.querySelector('h4').textContent,
                price: selectedRoom.dataset.price,
                name: name.value,
                email: email.value,
                requests: document.getElementById('requests').value
            };

            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to process booking');

            showNotification('Booking successful! We will send you a confirmation email shortly.', 'success');
            bookingForm.reset();
            roomOptions.forEach(opt => opt.classList.remove('border-blue-500'));
            selectedRoom = null;
            updatePrice();
        } catch (error) {
            showNotification('Failed to process booking. Please try again.', 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });
}

// Gallery Functionality
function initializeGallery() {
    const filterButtons = document.querySelectorAll('.gallery-filter');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    let currentImageIndex = 0;

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            const filter = button.dataset.filter;

            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Lightbox functionality
    const images = document.querySelectorAll('.gallery-item img');
    images.forEach((image, index) => {
        image.addEventListener('click', () => {
            currentImageIndex = index;
            openLightbox(image.src);
        });
    });

    // Lightbox controls
    window.openLightbox = function(src) {
        lightboxImage.src = src;
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function() {
        lightbox.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    window.previousImage = function() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        lightboxImage.src = images[currentImageIndex].src;
    };

    window.nextImage = function() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        lightboxImage.src = images[currentImageIndex].src;
    };

    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('hidden')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') previousImage();
            if (e.key === 'ArrowRight') nextImage();
        }
    });
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animations
function initializeAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeIn');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

// API Error Handling and Retry Logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

// API Cache
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
    const cached = apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    apiCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

// Update Weather Widget with error handling and caching
async function initializeWeatherWidget() {
    const weatherWidget = document.getElementById('weatherWidget');
    if (!weatherWidget) return;

    try {
        const cacheKey = 'weather_data';
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
            updateWeatherDisplay(weatherWidget, cachedData);
            return;
        }

        const response = await fetchWithRetry(`${WEATHER_API}?latitude=40.71&longitude=-74.01&current=temperature_2m,weathercode&timezone=auto`);
        const data = await response.json();
        
        setCachedData(cacheKey, data);
        updateWeatherDisplay(weatherWidget, data);
    } catch (error) {
        console.error('Weather API Error:', error);
        weatherWidget.innerHTML = `
            <div class="text-red-500">
                <i class="fas fa-exclamation-circle"></i>
                Weather information temporarily unavailable
            </div>
        `;
    }
}

function updateWeatherDisplay(widget, data) {
    const weatherCode = data.current.weathercode;
    const temperature = data.current.temperature_2m;
    
    // Weather code to icon mapping
    const weatherIcons = {
        0: '☀️', // Clear sky
        1: '🌤️', // Mainly clear
        2: '⛅', // Partly cloudy
        3: '☁️', // Overcast
        45: '🌫️', // Foggy
        48: '🌫️', // Depositing rime fog
        51: '🌧️', // Light drizzle
        53: '🌧️', // Moderate drizzle
        55: '🌧️', // Dense drizzle
        61: '🌧️', // Slight rain
        63: '🌧️', // Moderate rain
        65: '🌧️', // Heavy rain
        71: '🌨️', // Slight snow
        73: '🌨️', // Moderate snow
        75: '🌨️', // Heavy snow
        95: '⛈️', // Thunderstorm
    };

    widget.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="text-2xl">${weatherIcons[weatherCode] || '🌡️'}</span>
            <span class="text-lg">${temperature}°C</span>
        </div>
    `;
}

// Update Currency Converter with error handling and caching
async function initializeCurrencyConverter() {
    const currencyConverter = document.getElementById('currencyConverter');
    if (!currencyConverter) return;

    try {
        const cacheKey = 'currency_data';
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
            updateCurrencyDisplay(currencyConverter, cachedData);
            return;
        }

        const response = await fetchWithRetry(CURRENCY_API);
        const data = await response.json();
        
        setCachedData(cacheKey, data);
        updateCurrencyDisplay(currencyConverter, data);
    } catch (error) {
        console.error('Currency API Error:', error);
        currencyConverter.innerHTML = `
            <div class="text-red-500">
                <i class="fas fa-exclamation-circle"></i>
                Currency conversion temporarily unavailable
            </div>
        `;
    }
}

function updateCurrencyDisplay(converter, data) {
    const rates = data.rates;
    const baseAmount = 100; // Default amount in USD

    converter.innerHTML = `
        <div class="p-4 bg-white rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-2">Currency Converter</h3>
            <div class="flex items-center space-x-2">
                <input type="number" value="${baseAmount}" class="w-24 px-2 py-1 border rounded" id="amountInput">
                <select class="px-2 py-1 border rounded" id="currencySelect">
                    ${Object.keys(rates).map(currency => `<option value="${currency}">${currency}</option>`).join('')}
                </select>
                <span class="text-lg" id="convertedAmount">${(baseAmount * rates.EUR).toFixed(2)} EUR</span>
            </div>
        </div>
    `;

    // Add event listeners
    const amountInput = document.getElementById('amountInput');
    const currencySelect = document.getElementById('currencySelect');
    const convertedAmount = document.getElementById('convertedAmount');

    function updateConversion() {
        const amount = amountInput.value;
        const currency = currencySelect.value;
        convertedAmount.textContent = `${(amount * rates[currency]).toFixed(2)} ${currency}`;
    }

    amountInput.addEventListener('input', updateConversion);
    currencySelect.addEventListener('change', updateConversion);
}

// Update News Feed with error handling and caching
async function initializeNewsFeed() {
    const newsFeed = document.getElementById('newsFeed');
    if (!newsFeed) return;

    try {
        const cacheKey = 'news_data';
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
            updateNewsDisplay(newsFeed, cachedData);
            return;
        }

        const response = await fetchWithRetry(`${NEWS_API}?limit=3`);
        const data = await response.json();
        
        setCachedData(cacheKey, data);
        updateNewsDisplay(newsFeed, data);
    } catch (error) {
        console.error('News API Error:', error);
        newsFeed.innerHTML = `
            <div class="text-red-500">
                <i class="fas fa-exclamation-circle"></i>
                News feed temporarily unavailable
            </div>
        `;
    }
}

function updateNewsDisplay(feed, data) {
    feed.innerHTML = `
        <div class="space-y-4">
            <h3 class="text-lg font-semibold mb-2">Latest News</h3>
            ${data.results.map(article => `
                <div class="bg-white p-4 rounded-lg shadow">
                    <h4 class="font-semibold mb-2">${article.title}</h4>
                    <p class="text-sm text-gray-600 mb-2">${article.summary.substring(0, 100)}...</p>
                    <a href="${article.url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                        Read More →
                    </a>
                </div>
            `).join('')}
        </div>
    `;
}

// Performance Monitoring
const performanceMetrics = {
    pageLoad: performance.now(),
    apiCalls: 0,
    apiErrors: 0,
    cacheHits: 0
};

// Update the fetchWithRetry function to track metrics
const originalFetchWithRetry = fetchWithRetry;
fetchWithRetry = async function(url, options = {}, retries = MAX_RETRIES) {
    performanceMetrics.apiCalls++;
    try {
        const response = await originalFetchWithRetry(url, options, retries);
        return response;
    } catch (error) {
        performanceMetrics.apiErrors++;
        throw error;
    }
};

// Log performance metrics when page is unloaded
window.addEventListener('beforeunload', () => {
    const totalTime = performance.now() - performanceMetrics.pageLoad;
    console.log('Performance Metrics:', {
        totalTime: `${totalTime.toFixed(2)}ms`,
        apiCalls: performanceMetrics.apiCalls,
        apiErrors: performanceMetrics.apiErrors,
        cacheHits: performanceMetrics.cacheHits,
        cacheHitRate: `${((performanceMetrics.cacheHits / performanceMetrics.apiCalls) * 100).toFixed(2)}%`
    });
});

// Add Loading States
function addLoadingState(element) {
    element.classList.add('opacity-50', 'cursor-not-allowed');
    element.disabled = true;
    const originalText = element.textContent;
    element.innerHTML = `
        <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        </div>
    `;
    return originalText;
}

function removeLoadingState(element, originalText) {
    element.classList.remove('opacity-50', 'cursor-not-allowed');
    element.disabled = false;
    element.textContent = originalText;
}

// Add Error Boundary
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred. Please try again.', 'error');
});

// Add Offline Support
window.addEventListener('online', function() {
    showNotification('You are back online!', 'success');
});

window.addEventListener('offline', function() {
    showNotification('You are offline. Some features may not work.', 'error');
});

// Add Form Data Persistence
function saveFormData(formId, data) {
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
}

function loadFormData(formId) {
    const data = localStorage.getItem(`form_${formId}`);
    return data ? JSON.parse(data) : null;
}

// Add Form Auto-save
function initializeFormAutoSave(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const formData = loadFormData(formId);
    if (formData) {
        Object.keys(formData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = formData[key];
        });
    }

    form.addEventListener('input', (e) => {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        saveFormData(formId, data);
    });
}

// Initialize form auto-save for both forms
document.addEventListener('DOMContentLoaded', function() {
    initializeFormAutoSave('contactForm');
    initializeFormAutoSave('bookingForm');
});

// Accessibility Improvements
function initializeAccessibility() {
    // Add ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(button => {
        if (!button.textContent.trim()) {
            button.setAttribute('aria-label', 'Button');
        }
    });

    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content landmark
    const mainContent = document.querySelector('main') || document.querySelector('.max-w-7xl');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('role', 'main');
    }

    // Add keyboard navigation for gallery
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `View image ${index + 1}`);
        
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });

    // Add keyboard navigation for mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        mobileMenuButton.setAttribute('aria-controls', 'mobile-menu');
        
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Add focus trap for modals
    function createFocusTrap(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    // Add focus trap to lightbox
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        createFocusTrap(lightbox);
    }

    // Add live regions for dynamic content
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);

    // Update notification system to use live region
    const originalShowNotification = showNotification;
    showNotification = function(message, type) {
        liveRegion.textContent = message;
        originalShowNotification(message, type);
    };
}

// Add keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + H: Go to Home
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = 'index.html';
        }
        // Alt + B: Go to Booking
        if (e.altKey && e.key === 'b') {
            e.preventDefault();
            window.location.href = 'booking.html';
        }
        // Alt + R: Go to Rooms
        if (e.altKey && e.key === 'r') {
            e.preventDefault();
            window.location.href = 'rooms.html';
        }
        // Alt + G: Go to Gallery
        if (e.altKey && e.key === 'g') {
            e.preventDefault();
            window.location.href = 'gallery.html';
        }
        // Alt + C: Go to Contact
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            window.location.href = 'contact.html';
        }
        // Escape: Close any open modals
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}

// Add screen reader announcements
function announceToScreenReader(message) {
    const liveRegion = document.querySelector('[aria-live="polite"]');
    if (liveRegion) {
        liveRegion.textContent = message;
    }
} 