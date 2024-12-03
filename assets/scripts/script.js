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

  const translations = {
    en: {
      deployedToZone: "deployed to player zone.",
      zoneFull: "Player zone is full!",
    },
    zh: {
      deployedToZone: "已部署到玩家区域。",
      zoneFull: "玩家区域已满！",
    },
  };

  // Detect the language from the script tag
  const userLanguage = new URL(document.currentScript.src).searchParams.get("lang") || "en";

  // Ensure language fallback
  const lang = translations[userLanguage] ? userLanguage : "en";

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
    this.logAction("Game started. Draw 2 cards.");
  }

  buildDeck() {
      // Player deck
      const heroes = [
          "曹震", "孙策", "关羽", "张飞", "刘备", "黄忠", "诸葛亮", "貂蝉", 
          "吕布", "司马懿", "赵云", "周瑜", "孙尚香", "典韦", "黄承", "甘宁"
      ];

      for (let i = 0; i < 16; i++) {
          const attackValue = 5000 - (i + 1) * 500;
          if (attackValue > 0) {  // Ensure hero attack is greater than 0
              this.playerDeck.push(new Card(heroes[i], "hero", `/assets/images/heroes/heroes-${i+1}.png?version=1.0`, attackValue, 7 - Math.floor((i + 1) / 3)));
          }
      }

      const strategies = [
          "破阵图", "计中计", "埋伏之策", "积极防守", "奇兵突袭", "反间计", "火攻计", 
          "水淹之策", "联盟图谋", "谍报来临", "士气高扬", "解围计", "突破重围", 
          "诈降之计", "空城计", "诱敌深入"
      ];

      for (let i = 0; i < 8; i++) {
          this.playerDeck.push(new Card(strategies[i], "strategy", `/assets/images/strategy/strategy-${i+1}.png?version=1.0`, 1, 2, { type: "health", value: 1 }));
      }

      // Add Boost strategy cards
      for (let i = 8; i <= 9; i++) {
          this.playerDeck.push(new Card(strategies[i], "strategy", `/assets/images/strategy/strategy-${i+1}.png?version=1.0`, 1, 2, { type: "boost", value: 1000 }));
      }

      // Add Energy cards
      for (let i = 0; i < 16; i++) {
          this.playerDeck.push(new Card("元气", "energy", `/assets/images/energy/energy.png?version=1.0`));
      }

      // Enemy deck
      const enemies = [
          "曹操", "颜良", "张辽", "许褚", "王异", "袁绍", "董卓", "郭汜", "邓艾", 
          "何进", "夏侯惇", "陶谦", "高顺", "孙权", "华雄", "曹洪", "杨弘", "袁术"
      ];

      for (let i = 0; i < 18; i++) {
          const effect = i % 3 === 0 ? { type: "burn", cooldown: 2 } : null;
          this.enemyDeck.push(new Card(enemies[i], "enemy", `/assets/images/enemy/enemy-${i+1}.png?version=1.0`, 3000 + (i + 1) * 200, 4 + Math.floor((i + 1) / 3), effect));
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
      this.logAction(`${hero.name} ${translations[lang].deployedToZone}`);
    } else {
      this.logAction(translations[lang].zoneFull);
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
                   // hero.health += healthBoost;  // Apply health boost to heroes
              });

              this.logAction(`All heroes' luck increased by ${healthBoost}.`);
          } else if (card.effect.type === "boost") {
              // Apply attack boost to all heroes in player deck
              attackBoost = card.effect.value;
              this.playerZone.forEach(hero => {
                  if (hero.type === "hero") {
                       // hero.attack += attackBoost;  // Increase hero's attack
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

    // Luck Factor Calculation
    const heroLuckFactor = Math.random() * (hero.health + this.healthBoost * 100); // Luck factor based on hero health
    const enemyLuckFactor = Math.random() * (enemy.health * 100); // Luck factor based on enemy health
    
    console.log(`Hero Luck: ${heroLuckFactor.toFixed(2)}, Enemy Luck: ${enemyLuckFactor.toFixed(2)}`);

    // Apply the boost status to hero and enemy attacks
    const effectiveHeroAttack = hero.attack  + this.attackBoost + heroLuckFactor;  // Luck added to hero's attack
    const effectiveEnemyAttack = enemy.attack + enemyLuckFactor;  // Luck added to enemy's attack

    console.log(`Effective Hero Attack: ${effectiveHeroAttack.toFixed(2)}, Effective Enemy Attack: ${effectiveEnemyAttack.toFixed(2)}`);
    this.logAction(`Effective Hero Attack: ${effectiveHeroAttack.toFixed(2)}, Effective Enemy Attack: ${effectiveEnemyAttack.toFixed(2)}`);

    // Compare attack values and use luck to determine who wins
    if (effectiveHeroAttack < effectiveEnemyAttack) {
      // Hero's attack is lower than the enemy's attack: Hero loses health
      hero.health -= effectiveEnemyAttack;
      this.logAction(`${hero.name} attacked ${enemy.name}, but hero's attack is lower. Hero health reduced by ${effectiveEnemyAttack.toFixed(2)}.`);
      this.showFlyScreenEffect(hero, enemy, effectiveHeroAttack, effectiveEnemyAttack);
    } else if (effectiveHeroAttack > effectiveEnemyAttack) {
      // Hero's attack is higher than the enemy's attack: Enemy loses health
      enemy.health -= effectiveHeroAttack;
      this.logAction(`${hero.name} attacked ${enemy.name}, and hero's attack is higher. Enemy health reduced by ${effectiveHeroAttack.toFixed(2)}.`);
      this.showFlyScreenEffect(hero, enemy, effectiveHeroAttack, effectiveEnemyAttack);
    } else {
      // Both have the same attack: Both lose health
      hero.health -= effectiveHeroAttack;
      enemy.health -= effectiveEnemyAttack;
      this.logAction(`${hero.name} and ${enemy.name} have the same attack. Both hero and enemy's health reduced by ${effectiveHeroAttack.toFixed(2)}.`);
      this.showFlyScreenEffect(hero, enemy, effectiveHeroAttack, effectiveEnemyAttack);
    }

    // Decrease energy after the attack
    this.energyPool -= 1;

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
              detailsDiv.innerText = `${card.name || "Card"}\nAttack: ${card.attack || 0}\nLuck: ${card.health || 0}`;
          } else if (card.type === "energy") {
              detailsDiv.innerText = `${card.name || "Card"}`;
          } else if (card.type === "strategy") {
              if (card.effect.type === "health") {
                  detailsDiv.innerText = `${card.name || "Card"}\nEffect: Luck +${card.effect.value}`;
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
          detailsDiv.innerText = `${hero.name || "Hero"}\nAttack: ${attackWithBoost}\nLuck: ${healthWithBoost}`;

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
          detailsDiv.innerText = `${card.name || "Enemy"}\nAttack: ${card.attack || 0}\nLuck: ${card.health || 0}`;
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

  showFlyScreenEffect(hero, enemy, heroAttack, enemyAttack) {
    const flyScreenContainer = document.getElementById("battle-fly-screen");

    // Create a new fly screen item
    const flyItem = document.createElement("div");
    flyItem.classList.add("fly-screen-item");

    // Hero avatar
    const heroAvatar = document.createElement("div");
    heroAvatar.classList.add("fly-avatar");
    heroAvatar.style.backgroundImage = `url(${hero.image})`; // Assuming hero.avatar contains the avatar image URL
    flyItem.appendChild(heroAvatar);

    // Attack text
    const attackText = document.createElement("span");
    attackText.innerText = `${hero.name}: ${heroAttack.toFixed(0)} vs ${enemy.name}: ${enemyAttack.toFixed(0)}`;
    flyItem.appendChild(attackText);

    // Enemy avatar
    const enemyAvatar = document.createElement("div");
    enemyAvatar.classList.add("fly-avatar");
    enemyAvatar.style.backgroundImage = `url(${enemy.image})`; // Assuming enemy.avatar contains the avatar image URL
    flyItem.appendChild(enemyAvatar);

    // Add the item to the container
    flyScreenContainer.appendChild(flyItem);

    // Remove the item after the animation ends
    setTimeout(() => {
      flyItem.remove();
    }, 6000); // Match the animation duration (6 seconds)
  }

}

// Initialize game
const game = new GameEngine();
game.initializeGame();