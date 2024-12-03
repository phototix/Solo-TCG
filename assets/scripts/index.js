// Language selection
let selectedLanguage = 'en';  // Default to English

// Hero cards data (example)
const heroes = {
    en: [
        { name: "Cao Zhen", image: "/assets/images/heroes/heroes-1.png" },
        { name: "Sun Ce", image: "/assets/images/heroes/heroes-2.png" },
        { name: "Guan Yu", image: "/assets/images/heroes/heroes-3.png" },
        { name: "Zhang Fei", image: "/assets/images/heroes/heroes-4.png" },
        { name: "Liu Bei", image: "/assets/images/heroes/heroes-5.png" },
        { name: "Huang Zhong", image: "/assets/images/heroes/heroes-6.png" },
        { name: "Zhuge Liang", image: "/assets/images/heroes/heroes-7.png" },
        { name: "Diao Chan", image: "/assets/images/heroes/heroes-8.png" },
        { name: "Lu Bu", image: "/assets/images/heroes/heroes-9.png" },
        { name: "Sima Yi", image: "/assets/images/heroes/heroes-10.png" },
        { name: "Zhao Yun", image: "/assets/images/heroes/heroes-11.png" },
        { name: "Zhou Yu", image: "/assets/images/heroes/heroes-12.png" },
        { name: "Sun Shangxiang", image: "/assets/images/heroes/heroes-13.png" },
        { name: "Dian Wei", image: "/assets/images/heroes/heroes-14.png" },
        { name: "Huang Cheng", image: "/assets/images/heroes/heroes-15.png" },
        { name: "Gan Ning", image: "/assets/images/heroes/heroes-16.png" }
    ],
    zh: [
        { name: "曹震", image: "/assets/images/heroes/heroes-1.png" },
        { name: "孙策", image: "/assets/images/heroes/heroes-2.png" },
        { name: "关羽", image: "/assets/images/heroes/heroes-3.png" },
        { name: "张飞", image: "/assets/images/heroes/heroes-4.png" },
        { name: "刘备", image: "/assets/images/heroes/heroes-5.png" },
        { name: "黄忠", image: "/assets/images/heroes/heroes-6.png" },
        { name: "诸葛亮", image: "/assets/images/heroes/heroes-7.png" },
        { name: "貂蝉", image: "/assets/images/heroes/heroes-8.png" },
        { name: "吕布", image: "/assets/images/heroes/heroes-9.png" },
        { name: "司马懿", image: "/assets/images/heroes/heroes-10.png" },
        { name: "赵云", image: "/assets/images/heroes/heroes-11.png" },
        { name: "周瑜", image: "/assets/images/heroes/heroes-12.png" },
        { name: "孙尚香", image: "/assets/images/heroes/heroes-13.png" },
        { name: "典韦", image: "/assets/images/heroes/heroes-14.png" },
        { name: "黄承", image: "/assets/images/heroes/heroes-15.png" },
        { name: "甘宁", image: "/assets/images/heroes/heroes-16.png" }
    ]
};

// Function to dynamically populate the hero carousel
function populateHeroCarousel() {
    const heroData = heroes[selectedLanguage];
    const carouselElement = document.getElementById("heroCarousel");
    carouselElement.innerHTML = '';  // Clear any existing cards

    heroData.forEach(hero => {
        const card = document.createElement("div");
        card.classList.add("hero-card");

        // Add image and name to the card
        const heroImage = document.createElement("img");
        heroImage.src = hero.image;
        heroImage.alt = hero.name;

        const heroName = document.createElement("div");
        heroName.textContent = hero.name;

        card.appendChild(heroImage);
        card.appendChild(heroName);
        carouselElement.appendChild(card);
    });

    // Add carousel loop (auto-scrolling effect)
    let index = 0;
    setInterval(() => {
        const cards = document.querySelectorAll(".hero-card");
        cards.forEach(card => {
            card.style.transform = "translateX(-100%)";
        });

        index = (index + 1) % cards.length;
        cards.forEach((card, i) => {
            if (i === index) {
                card.style.transform = "translateX(0)";
            }
        });
    }, 2000); // Change every 2 seconds
}

// Language selection function
function selectLanguage(lang) {
    selectedLanguage = lang;
    populateHeroCarousel();
}

// Start Game function (for now, just console log)
function startGame() {
    alert("Game Started!");
    // Redirect to the game page (e.g., Chinese or English)
    window.location.href = selectedLanguage === 'zh' ? 'chinese.html' : 'english.html';
}

// Initialize carousel
populateHeroCarousel();
