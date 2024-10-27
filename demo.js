

const mineflayer = require('mineflayer')
const { goals, Movements, pathfinder } = require('mineflayer-pathfinder')
const pvp = require('mineflayer-pvp').plugin

const bot = mineflayer.createBot({
  host: 'localhost', // 服务器IP
  username: 'Bot', // 用户名
  port: 25565
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)

bot.on('chat', (username, message) => {
  if (username === bot.username) {
    //过滤掉机器人自己发的消息
    return
  }

  console.log(message)

  if (message == '木头') {
    find_woods();
  }

  if (message == '怪物') {
    find_monsters();
  }

  if (message == '过来') {
    find_player();
  }
  
  if (message == '攻击') {
    attack_mobs();
  }

  if (message == 'pvp') {
    pvp_player();
  }
})

bot.on('death', () => {
  console.log('我噶了!')
})

//发现木头
function find_woods(){
    const logBlocks = bot.findBlocks({
        //所有的木头方块的名字都是以_log结尾
        matching: block => block.name.endsWith('_log'),
        maxDistance: 16,
        count: 16
    });

    if (logBlocks){
        bot.chat('我找到了' + logBlocks.length + '木头');
        console.log('我找到了' + logBlocks.length + '木头')
    }
}

//发现怪物
function find_monsters(){
    const hostileMobs = [
        'zombie', 'skeleton', 'spider', 'creeper', 'enderman',
        'witch', 'slime', 'cave_spider', 'silverfish', 'husk'
    ];

    const targetMobs = Object.values(bot.entities).filter(entity => 
        hostileMobs.includes(entity.name) &&
        entity.position.distanceTo(bot.entity.position) < 16 &&
        entity.position.y >= bot.entity.position.y - 5
    );

    if (targetMobs.length) {
        bot.chat('周围有' + targetMobs.length + '个怪物');
        console.log('周围有' + targetMobs.length + '个怪物')
    }
    return targetMobs;
}


//找到玩家
async function find_player(){
  const player = bot.nearestEntity(entity => entity.type === 'player');
  const { x, y, z } = player.position;
  const goal = new goals.GoalNear(x, y, z, 1);
  const defaultMove = new Movements(bot);
  bot.pathfinder.setMovements(defaultMove);
  
  try {
      bot.chat('我来了');
      await bot.pathfinder.goto(goal);
  } catch (error) {
      bot.chat('我走不动了');
      console.log(error);
  }
}



//攻击怪物
function attack_mobs(){
  const targetMobs = find_monsters();
  if (targetMobs.length > 0){
    bot.pvp.attack(targetMobs[0]);
  } else {
    bot.chat('周围没有怪物');
  }
}



















//攻击玩家
function pvp_player(){
  bot.pvp.attack(bot.nearestEntity(entity => entity.type === 'player'));
}