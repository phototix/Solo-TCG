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
      this.playerDeck.push(new Card(`Hero-${i}`, "hero", `/assets/images/heroes/heroes-${i}.png?version=1.0`, 5000 - i * 500, 7 - Math.floor(i / 3)));
    }
    for (let i = 1; i <= 8; i++) {
      this.playerDeck.push(new Card(`Strategy-${i}`, "strategy", `/assets/images/strategy/strategy-${i}.png?version=1.0`, 0, 0, { type: "heal", value: 1 }));
    }
    for (let i = 0; i < 16; i++) {
      this.playerDeck.push(new Card("Energy", "energy", `/assets/images/energy/energy.png?version=1.0`));
    }

    // Enemy deck
    for (let i = 1; i <= 18; i++) {
      const effect = i % 3 === 0 ? { type: "burn", cooldown: 2 } : null;
      this.enemyDeck.push(new Card(`Enemy-${i}`, "enemy", `/assets/images/enemy/enemy-${i}.png?version=1.0`, 3000 + i * 200, 4 + Math.floor(i / 3), effect));
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
      const card = this.playerHand[cardIndex];

      if (card.type === "energy") {
          this.energyPool += 1; // Increase energy pool
          this.logAction(`Energy card used. Energy pool increased to ${this.energyPool}.`);

          // Remove the energy card from the player's hand
          this.playerHand.splice(cardIndex, 1);
          this.render();
      } else {
          this.logAction("This is not an energy card!");
      }
  }

  attackEnemy(heroIndex, enemyIndex) {
      const hero = this.playerZone[heroIndex];
      const enemy = this.enemyZone[enemyIndex];

      if (!hero) {
          this.logAction("No hero to attack with.");
          return;
      }

      if (!enemy) {
          this.logAction("No enemy to attack.");
          return;
      }

      // Deduct attack from enemy health
      enemy.health -= hero.attack;

      // If the enemy survives, deduct 1 health from the hero
      if (enemy.health > 0) {
          hero.health -= 1;
          this.logAction(`Hero attacked ${enemy.name}. Enemy health reduced to ${enemy.health}, but hero health reduced by 1.`);
      } else {
          this.logAction(`Hero defeated ${enemy.name}!`);
          this.enemyZone.splice(enemyIndex, 1); // Remove defeated enemy
      }

      // Check if hero survives
      if (hero.health <= 0) {
          this.logAction(`Hero ${hero.name} was knocked out.`);
          this.playerZone.splice(heroIndex, 1); // Remove defeated hero
      }

      // Check for victory
      if (this.enemyZone.length === 0) {
          this.endGame();
      }

      this.render(); // Re-render the game state
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

  endGame() {
      // Show the Bootstrap modal
      const endGameModal = new bootstrap.Modal(document.getElementById('endGameModal'));
      endGameModal.show();

      // Add an event listener for the restart button
      const restartButton = document.getElementById('restartGameBtn');
      restartButton.addEventListener('click', () => {
          this.restartGame();
          endGameModal.hide();
      });
  }

  restartGame() {
      this.initializeGame(); // Reset game state
      this.render();         // Re-render the game
  }

  render() {
      // Render player hand
      const handDiv = document.getElementById("hand-cards");
      handDiv.innerHTML = "";
      this.playerHand.forEach((card, index) => {
          const cardDiv = document.createElement("div");
          cardDiv.className = "game-card";
          cardDiv.style.backgroundImage = `url(${card.image})`;

          // Card details overlay
          const detailsDiv = document.createElement("div");
          detailsDiv.className = "card-details";
          if (card.type === "hero") {
            detailsDiv.innerText = `${card.name || "Card"}\nAttack: ${card.attack || 0}\nHealth: ${card.health || 0}`;
          } else if (card.type === "energy") {
            detailsDiv.innerText = `${card.name || "Card"}`;
          } else if (card.type === "strategy") {
            detailsDiv.innerText = `${card.name || "Card"}\nHealth: ${card.health || 0}`;
          }
          cardDiv.appendChild(detailsDiv);

          // Attach appropriate onclick handler
          cardDiv.onclick = () => {
              if (card.type === "hero") {
                  this.playHero(index);
              } else if (card.type === "energy") {
                  this.useEnergy(index);
              } else if (card.type === "strategy") {
                  this.logAction("Strategy cards not implemented yet."); // Placeholder
              }
          };

          handDiv.appendChild(cardDiv);
      });

      // Render player zone
      const zoneDiv = document.getElementById("zone-cards");
      zoneDiv.innerHTML = "";
      this.playerZone.forEach((card, index) => {
          const cardDiv = document.createElement("div");
          cardDiv.className = "game-card";
          cardDiv.style.backgroundImage = `url(${card.image})`;

          // Card details overlay
          const detailsDiv = document.createElement("div");
          detailsDiv.className = "card-details";
          detailsDiv.innerText = `${card.name || "Card"}\nAttack: ${card.attack || 0}\nHealth: ${card.health || 0}`;
          cardDiv.appendChild(detailsDiv);

          zoneDiv.appendChild(cardDiv);
      });

      // Render enemy zone
      const enemyDiv = document.getElementById("enemy-cards");
      enemyDiv.innerHTML = "";
      this.enemyZone.forEach((card, index) => {
          const cardDiv = document.createElement("div");
          cardDiv.className = "game-card";
          cardDiv.style.backgroundImage = `url(${card.image})`;

          // Card details overlay
          const detailsDiv = document.createElement("div");
          detailsDiv.className = "card-details";
          detailsDiv.innerText = `${card.name || "Enemy"}\nAttack: ${card.attack || 0}\nHealth: ${card.health || 0}`;
          cardDiv.appendChild(detailsDiv);

          // Enemy attack interaction
          cardDiv.onclick = () => this.attackEnemy(0, index); // Temporary logic for attacking with the first hero
          enemyDiv.appendChild(cardDiv);
      });

      // Update energy pool display
      document.getElementById("energy-pool").innerText = this.energyPool;
  }

}

// Initialize game
const game = new GameEngine();
game.initializeGame();