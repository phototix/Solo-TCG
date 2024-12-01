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
    this.attackBoost = 0;
    this.healthBoost = 0;
    document.getElementById("attack-pool").textContent = 0;
    document.getElementById("health-pool").textContent = 0;
    this.log = document.getElementById("log");
  }

  initializeGame() {
    this.buildDeck();
    this.shuffleDeck(this.playerDeck);
    this.shuffleDeck(this.enemyDeck);
    document.getElementById("attack-pool").textContent = 0;
    document.getElementById("health-pool").textContent = 0;

    for (let i = 0; i < 3; i++) this.drawCard();

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
          // Initialize or get the existing boost values
          let healthBoost = 0;
          let attackBoost = 0;

          if (card.effect.type === "health") {
              // Apply health boost to all heroes in player zone
              healthBoost = card.effect.value;
              this.playerZone.forEach(hero => {
                  hero.health += healthBoost;  // Apply health boost to heroes
              });

              this.logAction(`All heroes' health increased by ${healthBoost}.`);
          } else if (card.effect.type === "boost") {
              // Apply attack boost to all heroes in player deck
              attackBoost = card.effect.value;
              this.playerDeck.forEach(hero => {
                  if (hero.type === "hero") {
                      hero.attack += attackBoost;  // Increase hero's attack
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
          this.attackBoost = (this.attackBoost || 0) + attackBoost;  // Add to existing attack boost
          this.healthBoost = (this.healthBoost || 0) + healthBoost;  // Add to existing health boost
          this.updateBoostPool(this.attackBoost, this.healthBoost);
      } else {
          this.logAction("This is not a valid strategy card or the strategy doesn't have an effect.");
      }
  }

  updateBoostPool(attackBoost, healthBoost) {
      document.getElementById("attack-pool").textContent = attackBoost;
      document.getElementById("health-pool").textContent = healthBoost;
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

      // Apply the boost status to hero and enemy attacks
      const effectiveHeroAttack = hero.attack + (this.attackBoost || 0);  // Add attack boost
      const effectiveEnemyAttack = enemy.attack;  // You can add enemy specific boosts here if needed

      console.log(`Hero attack: ${effectiveHeroAttack}, Enemy attack: ${effectiveEnemyAttack}`);

      // Compare attack values
      if (effectiveHeroAttack < effectiveEnemyAttack) {
          // Hero's attack is lower than the enemy's attack: Hero loses health
          hero.health -= effectiveEnemyAttack;
          this.logAction(`${hero.name} attacked ${enemy.name}, but hero's attack is lower. Hero health reduced by ${effectiveEnemyAttack}.`);
      } else if (effectiveHeroAttack > effectiveEnemyAttack) {
          // Hero's attack is higher than the enemy's attack: Enemy loses health
          enemy.health -= effectiveHeroAttack;
          this.logAction(`${hero.name} attacked ${enemy.name}, and hero's attack is higher. Enemy health reduced by ${effectiveHeroAttack}.`);
      } else {
          // Both have the same attack: Both lose health
          hero.health -= effectiveHeroAttack;
          enemy.health -= effectiveEnemyAttack;
          this.logAction(`${hero.name} and ${enemy.name} have the same attack. Both hero and enemy's health reduced by ${effectiveHeroAttack}.`);
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
          this.endGame("You won!");
      }

      // Check if the player loses because they have no heroes left by turn 15
      if (this.turnCounter >= 15 && this.playerZone.length === 0) {
          this.endGame("You lost! No more heroes in your deck by turn 15.");
      }

      this.nextTurn();
      this.render(); // Re-render the game state
  }

  nextTurn() {
      // Check if the player has more than 10 cards in hand before proceeding
      if (this.playerHand.length >= 3) {
          this.logAction("You cannot proceed to the next turn with more than 3 cards in hand.");
          return; // Stop further execution if the player has 10 or more cards
      }

      this.turnCounter++;
      this.logAction(`Turn ${this.turnCounter} started.`);

      // Check if the game should end based on turn and player deck conditions
      if (this.turnCounter >= 15 && this.playerDeck.length === 0 && this.playerZone.length === 0) {
          this.endGame("You lost! You ran out of heroes in your deck and zone.");
          return; // Stop further execution if the game is over
      }

      // Check if the enemy is defeated (no enemies left in their zone)
      if (this.enemyZone.length === 0) {
          this.endGame("You won! All enemy heroes have been defeated.");
          return; // Stop further execution if the game is won
      }

      // Enemies act
      this.enemyZone.forEach((enemy) => {
        if (enemy.effect && enemy.effect.type === "burn") {
          // Example of burn effect (implement logic if needed)
          // this.burnHero();
        }
      });

      // Draw new cards for the player
      this.drawCard();
      this.drawCard();

      // Check for game loss if player has no heroes left in the deck and zone
      if (this.turnCounter >= 15 && this.playerDeck.length === 0 && this.playerZone.length === 0) {
          this.endGame("You lost! You have no heroes left in your deck and zone after turn 15.");
          return; // Stop the turn if the game ends
      }

      this.render(); // Re-render the game state
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

  endGame(message) {
      const endGameModal = new bootstrap.Modal(document.getElementById('endGameModal'));
      const endGameMessage = document.getElementById('endGameMessage');  // Assuming you have a place for the message in the modal
      endGameMessage.textContent = message;  // Set the end game message dynamically
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
      this.attackBoost = 0;
      this.healthBoost = 0;

      // Reset the boost status
      document.getElementById("attack-pool").textContent = 0;
      document.getElementById("health-pool").textContent = 0;

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