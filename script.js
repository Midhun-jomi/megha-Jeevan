document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------
    // 1. Audio Background Music Controller
    // -------------------------------------------------------------
    const bgAudio = document.getElementById('bg-audio');
    const musicToggle = document.getElementById('music-toggle');

    if (musicToggle && bgAudio) {
        // Set initial volume to 40% for pleasant background ambiance
        bgAudio.volume = 0.4;

        musicToggle.addEventListener('click', () => {
            if (bgAudio.paused) {
                playAudio();
            } else {
                pauseAudio();
            }
        });

        // Try to play audio automatically on first interaction (due to browser autoplay policies)
        const playOnInteraction = () => {
            playAudio();
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('scroll', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('scroll', playOnInteraction);
    }

    function playAudio() {
        if (bgAudio) {
            bgAudio.play().then(() => {
                musicToggle.classList.remove('paused');
            }).catch(err => {
                console.log("Autoplay blocked by browser policy:", err);
            });
        }
    }

    function pauseAudio() {
        if (bgAudio) {
            bgAudio.pause();
            musicToggle.classList.add('paused');
        }
    }


    // -------------------------------------------------------------
    // 2. Countdown Timer
    // -------------------------------------------------------------
    const countdownElement = document.getElementById('countdown');
    const daysVal = document.getElementById('days');
    const hoursVal = document.getElementById('hours');
    const minutesVal = document.getElementById('minutes');
    const secondsVal = document.getElementById('seconds');

    if (countdownElement) {
        const targetDateString = countdownElement.getAttribute('data-date');
        // Convert ISO format YYYY-MM-DDTHH:MM:SS to YYYY/MM/DD HH:MM:SS for cross-browser (Safari) compatibility
        const safeDateString = targetDateString.replace(/-/g, '/').replace('T', ' ');
        const targetDate = new Date(safeDateString).getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference < 0) {
                // Event has passed or is happening now
                countdownElement.innerHTML = "<div class='wedding-started-msg'>The Celebration Has Begun! ❤️</div>";
                clearInterval(countdownInterval);
                return;
            }

            // Calculations for days, hours, minutes and seconds
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Format values with leading zero if less than 10
            daysVal.textContent = days < 10 ? '0' + days : days;
            hoursVal.textContent = hours < 10 ? '0' + hours : hours;
            minutesVal.textContent = minutes < 10 ? '0' + minutes : minutes;
            secondsVal.textContent = seconds < 10 ? '0' + seconds : seconds;
        };

        // Run immediately on page load, then set interval
        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);
    }


    // -------------------------------------------------------------
    // 3. Smooth Scroll Down from Arrow
    // -------------------------------------------------------------
    const scrollArrow = document.getElementById('scroll-arrow');
    const quoteSection = document.getElementById('quote-section');

    if (scrollArrow && quoteSection) {
        scrollArrow.addEventListener('click', () => {
            quoteSection.scrollIntoView({ behavior: 'smooth' });
        });
    }


    // -------------------------------------------------------------
    // 4. Scroll Reveal Animations (Intersection Observer)
    // -------------------------------------------------------------
    const animatedElements = document.querySelectorAll('.event-card, .couple-card, .quote-container, .illustration-container');

    // Add scroll classes to elements
    animatedElements.forEach(el => el.classList.add('fade-in-section'));

    const scrollObserverOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Stop observing once animated in
            }
        });
    }, scrollObserverOptions);

    animatedElements.forEach(el => scrollObserver.observe(el));


    // -------------------------------------------------------------
    // 5. RSVP Storage & Custom wishes logic
    // -------------------------------------------------------------
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpSuccess = document.getElementById('rsvp-success');
    const wishesBoard = document.getElementById('wishes-board');

    // Fetch and display wishes
    const loadWishes = () => {
        const customWishes = JSON.parse(localStorage.getItem('weddingWishes')) || [];

        // Remove existing custom wish cards to reload correctly
        const existingCustom = wishesBoard.querySelectorAll('.custom-wish');
        existingCustom.forEach(card => card.remove());

        customWishes.forEach(wish => {
            const card = document.createElement('div');
            card.className = 'wish-card custom-wish';
            card.innerHTML = `
                <p class="wish-text">"${wish.text}"</p>
                <p class="wish-author">— ${wish.name}</p>
            `;
            wishesBoard.insertBefore(card, wishesBoard.firstChild); // Insert newest at the top
        });
    };

    // Load initial wishes
    loadWishes();

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('guest-name').value.trim();
            const email = document.getElementById('guest-email').value.trim();
            const wishes = document.getElementById('wishes').value.trim();

            // Save RSVP to Local Storage
            const rsvpData = {
                name,
                email,
                wishes,
                date: new Date().toISOString()
            };

            const rsvps = JSON.parse(localStorage.getItem('rsvps')) || [];
            rsvps.push(rsvpData);
            localStorage.setItem('rsvps', JSON.stringify(rsvps));

            // If guest left a message/wish, add it to wishes board
            if (wishes.length > 0) {
                const currentWishes = JSON.parse(localStorage.getItem('weddingWishes')) || [];
                currentWishes.push({
                    name: name,
                    text: wishes
                });
                localStorage.setItem('weddingWishes', JSON.stringify(currentWishes));
                loadWishes();
            }

            // Animate transition to success block
            rsvpForm.style.opacity = '0';

            // Send email notification via FormSubmit
            fetch("https://formsubmit.co/ajax/mjcmidhun@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    Name: name,
                    Email: email,
                    Wishes: wishes || "No message left.",
                    _subject: `New Wedding RSVP from ${name}!`
                })
            })
                .then(response => response.json())
                .then(data => console.log("Email sent successfully:", data))
                .catch(error => console.error("Error sending email:", error));

            setTimeout(() => {
                rsvpForm.classList.add('hidden');
                rsvpSuccess.classList.remove('hidden');
            }, 400);
        });
    }
});
