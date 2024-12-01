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
          const attackValue = 5000 - i * 500;
          if (attackValue > 0) {  // Ensure hero attack is greater than 0
              this.playerDeck.push(new Card(`Hero-${i}`, "hero", `/assets/images/heroes/heroes-${i}.png?version=1.0`, attackValue, 7 - Math.floor(i / 3)));
          }
      }

      for (let i = 1; i <= 8; i++) {
          this.playerDeck.push(new Card(`Strategy-${i}`, "strategy", `/assets/images/strategy/strategy-${i}.png?version=1.0`, 1, 2, { type: "health", value: 1 }));
      }

      // Add Boost strategy cards
      for (let i = 9; i <= 10; i++) {
          this.playerDeck.push(new Card(`Boost-${i}`, "strategy", `/assets/images/strategy/strategy-${i}.png?version=1.0`, 1, 2, { type: "boost", value: 1000 }));
      }

      // Add Energy cards
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

  // Updated useEnergy method to add energy to the pool and update visuals
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

  useStrategy(cardIndex) {
      const card = this.playerHand[cardIndex];

      if (card.type === "strategy" && card.effect) {
          // Update the strategy pool display variables
          let healthBoost = 0;
          let attackBoost = 0;

          if (card.effect.type === "health") {
              // Apply health boost to all heroes in player zone
              healthBoost = card.effect.value;
              this.playerZone.forEach(hero => {
                  hero.health += healthBoost;
              });

              this.logAction(`All heroes' health increased by ${healthBoost}.`);
          } else if (card.effect.type === "boost") {
              // Apply attack boost to all heroes in player deck
              attackBoost = card.effect.value;
              this.playerDeck.forEach(hero => {
                  if (hero.type === "hero") {
                      hero.attack += attackBoost; // Increase hero's attack
                  }
              });

              this.logAction(`All heroes' attack increased by ${attackBoost} due to Boost card.`);
          } else {
              this.logAction("This strategy card doesn't have a valid effect.");
          }

          // Remove the strategy card from the player's hand
          this.playerHand.splice(cardIndex, 1);
          this.render();

          // Update the strategy pool display
          this.updateBoostPool(attackBoost, healthBoost);
      } else {
          this.logAction("This is not a valid strategy card or the strategy doesn't have an effect.");
      }
  }

  updateBoostPool(attackBoost, healthBoost) {
      // Get the current values from the pool display
      let currentAttackBoost = parseInt(document.getElementById("attack-pool").textContent) || 0;
      let currentHealthBoost = parseInt(document.getElementById("health-pool").textContent) || 0;

      // Sum the existing and new boost values
      currentAttackBoost += attackBoost;
      currentHealthBoost += healthBoost;

      // Update the boost pool display with the new summed values
      document.getElementById("attack-pool").textContent = currentAttackBoost;
      document.getElementById("health-pool").textContent = currentHealthBoost;
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

      // Check if there is enough energy to attack
      if (this.energyPool < 1) {
          this.logAction("Not enough energy to attack!");
          return;
      }

      // Compare attack values
      if (hero.attack < enemy.attack) {
          // Hero's attack is lower than the enemy's attack: Hero loses health
          hero.health -= enemy.attack;
          this.logAction(`${hero.name} attacked ${enemy.name}, but hero's attack is lower. Hero health reduced by ${enemy.attack}.`);
      } else if (hero.attack > enemy.attack) {
          // Hero's attack is higher than the enemy's attack: Enemy loses health
          enemy.health -= hero.attack;
          this.logAction(`${hero.name} attacked ${enemy.name}, and hero's attack is higher. Enemy health reduced by ${hero.attack}.`);
      } else {
          // Both have the same attack: Both lose health
          hero.health -= hero.attack;
          enemy.health -= enemy.attack;
          this.logAction(`${hero.name} and ${enemy.name} have the same attack. Both hero and enemy's health reduced by ${hero.attack}.`);
      }

      // Decrease energy after the attack
      this.energyPool -= 1;
      this.logAction(`Energy pool decreased to ${this.energyPool} after attack.`);

      // Check if the enemy survives
      if (enemy.health <= 0) {
          this.logAction(`${enemy.name} was defeated!`);
          this.enemyZone.splice(enemyIndex, 1); // Remove defeated enemy
      }

      // Check if the hero survives
      if (hero.health <= 0) {
          this.logAction(`${hero.name} was knocked out.`);
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
        // this.burnHero();
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
      // Clear all existing cards and zones
      this.playerDeck = [];
      this.enemyDeck = [];
      this.playerHand = [];
      this.playerZone = [];
      this.enemyZone = [];
      this.energyPool = 0;
      this.turnCounter = 0;

      // Reset the log
      this.log.innerText = "Game restarted.";

      // Reinitialize the game
      this.initializeGame();
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
              if (card.effect.type === "health") {
                  detailsDiv.innerText = `${card.name || "Card"}\nEffect: Health +${card.effect.value}`;
              } else if (card.effect.type === "boost") {
                  detailsDiv.innerText = `${card.name || "Card"}\nEffect: Attack +${card.effect.value}`;
              } else {
                  detailsDiv.innerText = `${card.name || "Card"}\nEffect: Unknown Effect`;
              }
          }

          cardDiv.appendChild(detailsDiv);

          // Attach appropriate onclick handler
          cardDiv.onclick = () => {
              if (card.type === "hero") {
                  this.playHero(index);
              } else if (card.type === "energy") {
                  this.useEnergy(index);
              } else if (card.type === "strategy") {
                  this.useStrategy(index);  // Call the useStrategy method for strategy cards
              }
          };

          handDiv.appendChild(cardDiv);
      });

      // Render player zone (including heroes and their boosts)
      const zoneDiv = document.getElementById("zone-cards");
      zoneDiv.innerHTML = "";
      this.playerZone.forEach((hero, index) => {
          const cardDiv = document.createElement("div");
          cardDiv.className = "game-card";
          cardDiv.style.backgroundImage = `url(${hero.image})`;

          // Card details overlay
          const detailsDiv = document.createElement("div");
          detailsDiv.className = "card-details";

          // Show hero's stats and the boost status
          const attackWithBoost = hero.attack + (this.attackBoost || 0);  // Apply attack boost if any
          const healthWithBoost = hero.health + (this.healthBoost || 0);  // Apply health boost if any
          detailsDiv.innerText = `${hero.name || "Hero"}\nAttack: ${attackWithBoost}\nHealth: ${healthWithBoost}`;

          cardDiv.appendChild(detailsDiv);
          zoneDiv.appendChild(cardDiv);
      });

      // Render energy cards (showing a maximum of 3 stacked together)
      const energyZoneDiv = document.getElementById("energy-cards");
      const energyCardsDiv = document.createElement("div");
      energyCardsDiv.className = "energy-cards-stack";
      energyCardsDiv.style.position = "relative";
      
      // Limit to 3 energy cards for better visual display
      const energyCardCount = Math.min(this.energyPool, 3); // Show at most 3 cards

      for (let i = 0; i < energyCardCount; i++) {
          const energyCardDiv = document.createElement("div");
          energyCardDiv.className = "game-card energy-card";
          energyCardDiv.style.backgroundImage = `url(/assets/images/energy/energy.png?version=1.0)`;
          energyCardDiv.style.position = "absolute";
          energyCardDiv.style.top = `${i * 10}px`;  // Stacked position
          energyCardDiv.style.left = `${i * 5}px`; // Slight offset to simulate overlap

          energyCardsDiv.appendChild(energyCardDiv);
      }

      energyZoneDiv.appendChild(energyCardsDiv);

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

      // Update boost pool display
      this.updateBoostPool(this.attackBoost, this.healthBoost);
  }


}

// Initialize game
const game = new GameEngine();
game.initializeGame();