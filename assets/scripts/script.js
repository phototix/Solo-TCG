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
    this.logAction(systemTranslations[lang].gameStarted);
  }

  buildDeck() {
      // Player deck
      const heroes = systemTranslations[lang].heroes;

      for (let i = 0; i < 16; i++) {
          const attackValue = 5000 - (i + 1) * 500;
          if (attackValue > 0) {  // Ensure hero attack is greater than 0
              this.playerDeck.push(new Card(heroes[i], "hero", `/assets/images/heroes/heroes-${i+1}.png?version=1.0`, attackValue, 7 - Math.floor((i + 1) / 3)));
          }
      }

      const strategies = systemTranslations[lang].strategies;

      for (let i = 0; i < 8; i++) {
          this.playerDeck.push(new Card(strategies[i], "strategy", `/assets/images/strategy/strategy-${i+1}.png?version=1.0`, 1, 2, { type: "health", value: 1 }));
      }

      // Add Boost strategy cards
      for (let i = 8; i <= 9; i++) {
          this.playerDeck.push(new Card(strategies[i], "strategy", `/assets/images/strategy/strategy-${i+1}.png?version=1.0`, 1, 2, { type: "boost", value: 1000 }));
      }

      // Add Energy cards
      for (let i = 0; i < 16; i++) {
          this.playerDeck.push(new Card(systemTranslations[lang].energyCard, "energy", `/assets/images/energy/energy.png?version=1.0`));
      }

      // Enemy deck
      const enemies = systemTranslations[lang].enemies;

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
      this.logAction(`${hero.name} ${systemTranslations[lang].deployedToZone}`);
    } else {
      this.logAction(systemTranslations[lang].zoneFull);
    }
    this.render();
  }

  // Updated useEnergy method to add energy to the pool and update visuals
  useEnergy(cardIndex) {
      const card = this.playerHand[cardIndex];

      if (card.type === "energy") {
          this.energyPool += 1; // Increase energy pool
          this.logAction(`${systemTranslations[lang].energyUsed} ${this.energyPool}.`);

          // Remove the energy card from the player's hand
          this.playerHand.splice(cardIndex, 1);
          this.render();
      } else {
          this.logAction(systemTranslations[lang].notEnergyCard);
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

              this.logAction(systemTranslations[lang].strategyHealthBoost.replace("{value}", healthBoost));
          } else if (card.effect.type === "boost") {
              // Apply attack boost to all heroes in player deck
              attackBoost = card.effect.value;
              this.playerZone.forEach(hero => {
                  if (hero.type === "hero") {
                       // hero.attack += attackBoost;  // Increase hero's attack
                  }
              });

              this.logAction(systemTranslations[lang].strategyAttackBoost.replace("{value}", attackBoost));
          } else {
              this.logAction(systemTranslations[lang].invalidStrategyEffect);
          }

          // Remove the strategy card from the player's hand
          this.playerHand.splice(cardIndex, 1);
          this.render();

          // Update the strategy pool display
          this.attackBoost = (this.attackBoost || 0) + attackBoost;  // Add to existing attack boost
          this.healthBoost = (this.healthBoost || 0) + healthBoost;  // Add to existing health boost
          this.updateBoostPool(this.attackBoost, this.healthBoost);
      } else {
          this.logAction(systemTranslations[lang].invalidStrategyCard);
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
      this.logAction(systemTranslations[lang].noHeroToAttack);
      return;
    }

    if (!enemy) {
      this.logAction(systemTranslations[lang].noEnemyToAttack);
      return;
    }

    // Check if there is enough energy to attack
    if (this.energyPool < 1) {
      this.logAction(systemTranslations[lang].notEnoughEnergy);
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

    // Compare attacks and apply results
    if (effectiveHeroAttack < effectiveEnemyAttack) {
      hero.health -= effectiveEnemyAttack;
      this.logAction(
        systemTranslations[lang].heroLoses
          .replace("{hero}", hero.name)
          .replace("{enemy}", enemy.name)
          .replace("{damage}", effectiveEnemyAttack.toFixed(2))
      );
      this.showFlyScreenEffect(hero, enemy, effectiveHeroAttack, effectiveEnemyAttack);
    } else if (effectiveHeroAttack > effectiveEnemyAttack) {
      enemy.health -= effectiveHeroAttack;
      this.logAction(
        systemTranslations[lang].heroWins
          .replace("{hero}", hero.name)
          .replace("{enemy}", enemy.name)
          .replace("{damage}", effectiveHeroAttack.toFixed(2))
      );
      this.showFlyScreenEffect(hero, enemy, effectiveHeroAttack, effectiveEnemyAttack);
    } else {
      hero.health -= effectiveHeroAttack;
      enemy.health -= effectiveEnemyAttack;
      this.logAction(
        systemTranslations[lang].tie
          .replace("{hero}", hero.name)
          .replace("{enemy}", enemy.name)
          .replace("{damage}", effectiveHeroAttack.toFixed(2))
      );
      this.showFlyScreenEffect(hero, enemy, effectiveHeroAttack, effectiveEnemyAttack);
    }

    // Decrease energy after the attack
    this.energyPool -= 1;

    // Check if the enemy survives
    if (enemy.health <= 0) {
      this.logAction(systemTranslations[lang].enemyDefeated.replace("{enemy}", enemy.name));
      this.enemyZone.splice(enemyIndex, 1); // Remove defeated enemy
    }

    // Check if the hero survives
    if (hero.health <= 0) {
      this.logAction(systemTranslations[lang].heroDefeated.replace("{hero}", hero.name));
      this.playerZone.splice(heroIndex, 1); // Remove defeated hero
    }

    // Check for victory
    if (this.enemyZone.length === 0) {
      this.endGame(systemTranslations[lang].victory);
    }

    // Check if the player loses because they have no heroes left by turn 15
    if (this.turnCounter >= 15 && this.playerZone.length === 0) {
      this.endGame(systemTranslations[lang].lossNoHeroes); 
    }

    this.nextTurn();
    this.render(); // Re-render the game state
  }


  nextTurn() {
      // Check if the player has more than 10 cards in hand before proceeding
      if (this.playerHand.length >= 3) {
          this.logAction(systemTranslations[lang].tooManyCards);
          return; // Stop further execution if the player has 10 or more cards
      }

      this.turnCounter++;
      this.logAction(format(systemTranslations[lang].turnStarted, this.turnCounter));

      // Check if the game should end based on turn and player deck conditions
      if (this.turnCounter >= 15 && this.playerDeck.length === 0 && this.playerZone.length === 0) {
          this.endGame(systemTranslations[lang].gameLostDeck);
          return; // Stop further execution if the game is over
      }

      // Check if the enemy is defeated (no enemies left in their zone)
      if (this.enemyZone.length === 0) {
          this.endGame(systemTranslations[lang].gameWon);
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
          this.endGame(systemTranslations[lang].gameLostNoHeroes);
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
              detailsDiv.innerText = `${card.name || systemTranslations[lang].card}\n${systemTranslations[lang].attack}: ${card.attack || 0}\n${systemTranslations[lang].luck}: ${card.health || 0}`;
          } else if (card.type === "energy") {
              detailsDiv.innerText = `${card.name || systemTranslations[lang].card}`;
          } else if (card.type === "strategy") {
              if (card.effect.type === "health") {
                  detailsDiv.innerText = `${card.name || systemTranslations[lang].card}\n${systemTranslations[lang].effect}: ${systemTranslations[lang].healthEffect}${card.effect.value}`;
              } else if (card.effect.type === "boost") {
                  detailsDiv.innerText = `${card.name || systemTranslations[lang].card}\n${systemTranslations[lang].effect}: ${systemTranslations[lang].boostEffect}${card.effect.value}`;
              } else {
                  detailsDiv.innerText = `${card.name || systemTranslations[lang].card}\n${systemTranslations[lang].effect}: ${systemTranslations[lang].unknownEffect}`;
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
          detailsDiv.innerText = `${hero.name}\n${attackText}: ${attackWithBoost}\n${luckText}: ${healthWithBoost}`;

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

          // Use translations for dynamic language support
          const attackText = systemTranslations[lang]?.attack || "Attack";
          const luckText = systemTranslations[lang]?.luck || "Luck";
          const enemyName = card.name || systemTranslations[lang]?.enemy || "Enemy";

          detailsDiv.innerText = `${enemyName}\n${attackText}: ${card.attack || 0}\n${luckText}: ${card.health || 0}`;
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

const systemTranslations = {
  en: {
    deployedToZone: "deployed to player zone.",
    zoneFull: "Player zone is full!",
    energyUsed: "Energy card used. Energy pool increased to",
    notEnergyCard: "This is not an energy card!",
    strategyHealthBoost: "All heroes' health increased by {value}.",
    strategyAttackBoost: "All heroes' attack increased by {value} due to the strategy card.",
    invalidStrategyEffect: "This strategy card doesn't have a valid effect.",
    invalidStrategyCard: "This is not a valid strategy card or the strategy doesn't have an effect.",
    noHeroToAttack: "No hero to attack with.",
    noEnemyToAttack: "No enemy to attack.",
    notEnoughEnergy: "Not enough energy to attack!",
    effectiveAttack: "Effective Hero Attack: {heroAttack}, Effective Enemy Attack: {enemyAttack}.",
    heroLoses: "{hero} attacked {enemy}, but hero's attack is lower. Hero health reduced by {damage}.",
    heroWins: "{hero} attacked {enemy}, and hero's attack is higher. Enemy health reduced by {damage}.",
    tie: "{hero} and {enemy} have the same attack. Both hero and enemy's health reduced by {damage}.",
    enemyDefeated: "{enemy} was defeated!",
    heroDefeated: "{hero} was knocked out.",
    victory: "You won!",
    lossNoHeroes: "You lost! No more heroes in your deck by turn 15.",
    tooManyCards: "You cannot proceed to the next turn with more than 3 cards in hand.",
    turnStarted: "Turn {0} started.",
    gameLostDeck: "You lost! You ran out of heroes in your deck and zone.",
    gameWon: "You won! All enemy heroes have been defeated.",
    gameLostNoHeroes: "You lost! You have no heroes left in your deck and zone after turn 15.",
    card: "Card",
    attack: "Attack",
    luck: "Luck",
    effect: "Effect",
    healthEffect: "Luck +",
    boostEffect: "Attack +",
    unknownEffect: "Unknown Effect",
    gameStarted: "Game started. Draw 2 cards.",
    energyCard: "Energy",
    heroes: [
      "Cao Zhen", "Sun Ce", "Guan Yu", "Zhang Fei", "Liu Bei", "Huang Zhong", "Zhuge Liang", "Diao Chan", 
      "Lu Bu", "Sima Yi", "Zhao Yun", "Zhou Yu", "Sun Shangxiang", "Dian Wei", "Huang Cheng", "Gan Ning"
    ],
    strategies: [
      "Breaking the Formation", "Counter-Strategy", "Ambush Strategy", "Active Defense", "Surprise Attack", 
      "Counter-Scheme", "Fire Attack", "Flood Strategy", "Alliance Plot", "Spy Report", "Morale High", 
      "Break the Siege", "Surrender Strategy", "Empty City Tactic", "Luring the Enemy In"
    ],
    enemies: [
      "Cao Cao", "Yan Liang", "Zhang Liao", "Xu Chu", "Wang Yi", "Yuan Shao", "Dong Zhuo", "Guo Si", "Deng Ai", 
      "He Jin", "Xiahou Dun", "Tao Qian", "Gao Shun", "Sun Quan", "Hua Xiong", "Cao Hong", "Yang Hong", "Yuan Shu"
    ],
  },
  zh: {
    deployedToZone: "已部署到玩家区域。",
    zoneFull: "玩家区域已满！",
    energyUsed: "使用了能量卡。能量池增加到",
    notEnergyCard: "这不是能量卡！",
    strategyHealthBoost: "所有英雄的健康增加了{value}点。",
    strategyAttackBoost: "由于策略卡，所有英雄的攻击力增加了{value}点。",
    invalidStrategyEffect: "此策略卡没有有效效果。",
    invalidStrategyCard: "这不是有效的策略卡，或者策略没有效果。",
    noHeroToAttack: "没有英雄可以攻击。",
    noEnemyToAttack: "没有敌人可以攻击。",
    notEnoughEnergy: "元气不足，无法攻击！",
    effectiveAttack: "英雄有效攻击力：{heroAttack}，敌人有效攻击力：{enemyAttack}。",
    heroLoses: "{hero} 攻击 {enemy}，但英雄攻击较低。英雄生命值减少 {damage}。",
    heroWins: "{hero} 攻击 {enemy}，英雄攻击较高。敌人生命值减少 {damage}。",
    tie: "{hero} 和 {enemy} 的攻击相同。英雄和敌人生命值均减少 {damage}。",
    enemyDefeated: "{enemy} 被击败了！",
    heroDefeated: "{hero} 被击倒了。",
    victory: "你赢了！",
    lossNoHeroes: "你输了！在第 15 回合后卡组中没有英雄。",
    tooManyCards: "您无法继续下一回合，因为手牌超过 3 张。",
    turnStarted: "第 {0} 回合开始。",
    gameLostDeck: "您输了！您的牌库和区域都没有英雄了。",
    gameWon: "您赢了！所有敌方英雄都被击败。",
    gameLostNoHeroes: "您输了！第 15 回合后，您的牌库和区域没有英雄了。",
    card: "卡牌",
    attack: "攻击",
    luck: "运气",
    effect: "效果",
    healthEffect: "运气 +",
    boostEffect: "攻击 +",
    unknownEffect: "未知效果",
    gameStarted: "游戏开始。抽取 2 张卡片。",
    energyCard: "元气",
    heroes: [
      "曹震", "孙策", "关羽", "张飞", "刘备", "黄忠", "诸葛亮", "貂蝉", 
      "吕布", "司马懿", "赵云", "周瑜", "孙尚香", "典韦", "黄承", "甘宁"
    ],
    strategies: [
      "破阵图", "计中计", "埋伏之策", "积极防守", "奇兵突袭", "反间计", "火攻计", 
      "水淹之策", "联盟图谋", "谍报来临", "士气高扬", "解围计", "突破重围", 
      "诈降之计", "空城计", "诱敌深入"
    ],
    enemies: [
      "曹操", "颜良", "张辽", "许褚", "王异", "袁绍", "董卓", "郭汜", "邓艾", 
      "何进", "夏侯惇", "陶谦", "高顺", "孙权", "华雄", "曹洪", "杨弘", "袁术"
    ],
  },
};

// Detect the language from the script tag
const userLanguage = new URL(document.currentScript.src).searchParams.get("lang") || "en";

// Ensure language fallback
const lang = systemTranslations[userLanguage] ? userLanguage : "en";

function format(message, ...values) {
  return message.replace(/{(\d+)}/g, (match, number) => (typeof values[number] !== "undefined" ? values[number] : match));
}

game.initializeGame();