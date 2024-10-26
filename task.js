const {goals, Movements } = require('mineflayer-pathfinder')


class Task {
    constructor(run, cancel) {
      this.run = run;
      this.cancel = cancel;
    }
}

class ComeTask extends Task {
    constructor(bot) {
        super(
            () => this.runToPlayer(),
            () => this.cancelToPlayer()
        );
        this.bot = bot;
    }

    async runToPlayer() {
        console.log('!!!!runToPlayer');
        const player = this.bot.nearestEntity(entity => entity.type === 'player');
        if (!player) {
            this.bot.chat('你在哪？');
            return;
        }

        const { x, y, z } = player.position;
        const goal = new goals.GoalNear(x, y, z, 1);
        const defaultMove = new Movements(this.bot);
        this.bot.pathfinder.setMovements(defaultMove);
        

        try {
            this.bot.chat('我来了');
            await this.bot.pathfinder.goto(goal);
        } catch (error) {
            this.bot.chat('我走不动了');
            console.log(error);
        }
    }

    async cancelToPlayer() {
        this.bot.pathfinder.setGoal(null);
        while (this.bot.pathfinder.isMoving()) {
            this.bot.waitForTicks(10);
        }
    }
}


class KillTask extends Task {
    constructor(bot) {
        super(
            () => this.killMobs(),
            () => this.cancelMobs()
        );
        this.bot = bot;
        this.stopKill = false;
        this.isExited = false;
    }

    async runToPlayer() {
        const player = this.bot.nearestEntity(entity => entity.type === 'player');
        if (!player) {
            this.bot.chat('你在哪？');
            return;
        }
        const { x, y, z } = player.position;
        const goal = new goals.GoalNear(x, y, z, 1);
        const defaultMove = new Movements(this.bot);
        this.bot.pathfinder.setMovements(defaultMove);
        await this.bot.pathfinder.goto(goal);
    }

    findMob(player) {
        const hostileMobs = [
            'zombie', 'skeleton', 'spider', 'creeper', 'enderman',
            'witch', 'slime', 'cave_spider', 'silverfish', 'husk'
        ];

        const targetMobs = Object.values(this.bot.entities).filter(entity => 
            hostileMobs.includes(entity.name) &&
            entity.position.distanceTo(this.bot.entity.position) < 16 &&
            entity.position.y >= this.bot.entity.position.y - 5
        );

        if (targetMobs.length === 0) {
            this.bot.chat('周围没有发现敌对生物。');
            return null;
        }

        // 找到离玩家最近的怪物
        return targetMobs.reduce((nearest, current) => {
            const distToCurrent = current.position.distanceTo(player.position);
            const distToNearest = nearest.position.distanceTo(player.position);
            return distToCurrent < distToNearest ? current : nearest;
        }, targetMobs[0]);
    }

    async killMobs() {
        const player = this.bot.nearestEntity(entity => entity.type === 'player');
        if (!player) {
            this.bot.chat('你在哪？');
            return;
        }

        try {
            await this.runToPlayer();
            while (!this.stopKill) {
                const mob = this.findMob(player);
                if (!mob) {
                    this.bot.chat('周围没有发现敌对生物。');
                    return;
                }

                console.log(`kill mob: ${mob.name}`);
                this.bot.pvp.attack(mob);

                await this.bot.waitForTicks(30);
                if (this.bot.entity.position.distanceTo(player.position) > 16) { 
                    this.bot.chat('我现在回来');
                    await this.runToPlayer();
                }
            }
        } catch (error) {
            this.bot.chat('好像有错误，停止攻击');
            console.log(error);
        } finally {
            this.isExited = true;
            console.log('!!!!killMobs exited');
        }
    }

    async cancelMobs() {
        this.stopKill = true;
        this.bot.pvp.stop();
        while (!this.isExited) {
            await this.bot.waitForTicks(10);
        }
        this.bot.chat('已停止攻击怪物。');
    }
}

class CollectTask extends Task {
    constructor(bot) {
        super(
            () => this.collect(),
            () => this.cancelCollect()
        );
        this.bot = bot;
        this.isExited = false;
        this.isCanceled = false;
    }

    async collect() {
        const player = this.bot.nearestEntity(entity => entity.type === 'player');
        if (!player) {
            this.bot.chat('找不到玩家');
            return;
        }

        try {
            let collectedCount = 0;
            while (collectedCount < 5 && !this.isCanceled) {
                // 1. 找到最近的木头方块
                const logBlock = this.bot.findBlock({
                    matching: block => block.name.endsWith('_log'),
                    maxDistance: 16,
                    useExtraInfo: true,
                    point: this.bot.entity.position
                });

                if (!logBlock) {
                    this.bot.chat('附近找不到木头方块');
                    break;
                }

                try {
                    await this.bot.collectBlock.collect(logBlock);
                    collectedCount++;
                    this.bot.chat(`已收集 ${collectedCount} 个木头`);
                } catch (error) {
                    console.log(error);
                    break;
                }
            }

            // 返回玩家身边并丢出木头
            const finalGoal = new goals.GoalNear(player.position.x, player.position.y, player.position.z, 2);
            await this.bot.pathfinder.goto(finalGoal);
            
            // 查找背包中的所有木头并丢出
            const logs = this.bot.inventory.items().filter(item => item.name.endsWith('_log'));
            if (logs.length > 0) {
                this.bot.chat('我把收集到的木头放在这里了');
                for (const log of logs) {
                    await this.bot.tossStack(log);
                    await this.bot.waitForTicks(10); // 等待一小段时间再丢下一个
                }
            }
            
            this.bot.chat('木头收集完成！');

        } catch (error) {
            this.bot.chat('收集木头时出错了');
            console.log(error);
        } finally {
            this.isExited = true;
        }
    }

    async cancelCollect() {
        this.isCanceled = true;
        while (!this.isExited) {
            await this.bot.waitForTicks(10);
        }
        this.bot.chat('已停止收集木头。');
    }
}

module.exports = { Task,  ComeTask, KillTask, CollectTask };
