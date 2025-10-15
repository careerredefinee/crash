document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const navbarHeight = 100; // Height in pixels when scrolled
    let lastScrollTop = 0;
    
    // Add scroll event listener
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove scrolled class based on scroll position
        if (scrollTop > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Optional: Hide navbar on scroll down, show on scroll up
        if (scrollTop > lastScrollTop && scrollTop > navbarHeight) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up or at top
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    }, { passive: true });
    
    // Initialize navbar state
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    }
});
