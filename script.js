// script.js
class Card {
  constructor(name, type, image, attack = 0, health = 0, effect = null) {
    this.name = name;
    this.type = type; // "hero", "strategy", "energy", "enemy"
    this.image = image;
    this.attack = attack;
    this.health = health;
    this.effect = effect; // Passive/active effects for enemies
  }
}

class GameEngine {
  constructor() {
    this.playerDeck = [];
    this.enemyDeck = [];
    this.playerHand = [];
    this.playerZone = [];
    this.energyPool = 0;
    this.enemyZone = [];
    this.turnCounter = 0;
    this.log = document.getElementById("log");
  }

  initializeGame() {
    this.buildDeck();
    this.shuffleDeck(this.playerDeck);
    this.shuffleDeck(this.enemyDeck);

    for (let i = 0; i < 5; i++) this.drawCard();

    for (let i = 0; i < 6; i++) {
      this.enemyZone.push(this.enemyDeck.pop());
    }

    this.render();
    document.getElementById("next-turn").addEventListener("click", () => this.nextTurn());
  }

  buildDeck() {
    // Player deck
    for (let i = 1; i <= 16; i++) {
      this.playerDeck.push(new Card(`Hero-${i}`, "hero", `heroes-${i}.png`, 5000 - i * 500, 7 - Math.floor(i / 3)));
    }
    for (let i = 1; i <= 8; i++) {
      this.playerDeck.push(new Card(`Strategy-${i}`, "strategy", `Strategy-0${i}.png`, 0, 0, { type: "heal", value: 1 }));
    }
    for (let i = 0; i < 16; i++) {
      this.playerDeck.push(new Card("Energy", "energy", `energy.png`));
    }

    // Enemy deck
    for (let i = 1; i <= 18; i++) {
      const effect = i % 3 === 0 ? { type: "burn", cooldown: 2 } : null;
      this.enemyDeck.push(new Card(`Enemy-${i}`, "enemy", `Enemy-0${i}.png`, 3000 + i * 200, 4 + Math.floor(i / 3), effect));
    }
  }

  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  drawCard() {
    if (this.playerDeck.length > 0) {
      this.playerHand.push(this.playerDeck.pop());
    }
  }

  playHero(cardIndex) {
    if (this.playerZone.length < 3) {
      const hero = this.playerHand.splice(cardIndex, 1)[0];
      this.playerZone.push(hero);
      this.logAction(`${hero.name} deployed to player zone.`);
    } else {
      this.logAction("Player zone is full!");
    }
    this.render();
  }

  useEnergy(cardIndex) {
    if (this.playerHand[cardIndex].type === "energy") {
      this.energyPool += 1;
      this.playerHand.splice(cardIndex, 1);
      this.logAction("Energy used. Energy pool increased.");
    }
    this.render();
  }

  attackEnemy(heroIndex, enemyIndex) {
    const hero = this.playerZone[heroIndex];
    const enemy = this.enemyZone[enemyIndex];

    if (this.energyPool > 0) {
      this.energyPool -= 1;
      enemy.health -= hero.attack;

      this.logAction(`${hero.name} attacked ${enemy.name} for ${hero.attack} damage.`);
      if (enemy.health <= 0) {
        this.enemyZone.splice(enemyIndex, 1);
        this.logAction(`${enemy.name} defeated!`);
      }
    } else {
      this.logAction("Not enough energy to attack!");
    }
    this.render();
  }

  nextTurn() {
    this.turnCounter++;
    this.logAction(`Turn ${this.turnCounter} started.`);

    // Enemies act
    this.enemyZone.forEach((enemy) => {
      if (enemy.effect && enemy.effect.type === "burn") {
        this.burnHero();
      }
    });

    // Draw new cards for the player
    this.drawCard();
    this.drawCard();

    this.render();
  }

  burnHero() {
    if (this.playerZone.length > 0) {
      const burnedHero = this.playerZone.shift();
      this.logAction(`${burnedHero.name} was burned by an enemy effect!`);
    }
  }

  logAction(action) {
    this.log.innerText = action;
  }

  render() {
    // Render player hand
    const handDiv = document.getElementById("hand-cards");
    handDiv.innerHTML = "";
    this.playerHand.forEach((card, index) => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.style.backgroundImage = `url(${card.image})`;
      cardDiv.onclick = () => {
        if (card.type === "hero") this.playHero(index);
        else if (card.type === "energy") this.useEnergy(index);
      };
      handDiv.appendChild(cardDiv);
    });

    // Render player zone
    const zoneDiv = document.getElementById("zone-cards");
    zoneDiv.innerHTML = "";
    this.playerZone.forEach((card, index) => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.style.backgroundImage = `url(${card.image})`;
      zoneDiv.appendChild(cardDiv);
    });

    // Render enemy zone
    const enemyDiv = document.getElementById("enemy-cards");
    enemyDiv.innerHTML = "";
    this.enemyZone.forEach((card, index) => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.style.backgroundImage = `url(${card.image})`;
      cardDiv.onclick = () => this.attackEnemy(0, index); // Temporary logic for attacking with the first hero
      enemyDiv.appendChild(cardDiv);
    });

    // Update energy pool
    document.getElementById("energy-pool").innerText = this.energyPool;
  }
}

// Initialize game
const game = new GameEngine();
game.initializeGame();