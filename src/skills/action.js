const Vec3 = require('vec3');
const { goals: { Goal, GoalNear, GoalBlock}, Pathfinder, Movements } = require('mineflayer-pathfinder');


class Action {
    constructor(bot, logger) {
        this.bot = bot;
        this.logger = logger;
        this.mcData = require('minecraft-data')(bot.version);

    }
    async wave(times = 3) {
        for (let i = 0; i < times; i++) {
            // 挥动主手
            await this.bot.swingArm('right');
            // 等待一小段时间
            await this.bot.waitForTicks(10);
            
            // 如果不是最后一次挥手，就等待更长时间
            if (i < times - 1) {
                await this.bot.waitForTicks(20);
            }
        }
    }

    async sneak(duration = 40) {
        this.bot.setControlState('sneak', true);
        await this.bot.waitForTicks(duration);
        this.bot.setControlState('sneak', false);
    }

    async jump(times = 1) {
        for (let i = 0; i < times; i++) {
            this.bot.setControlState('jump', true);
            await this.bot.waitForTicks(10);
            this.bot.setControlState('jump', false);
            
            if (i < times - 1) {
                await this.bot.waitForTicks(10);
            }
        }
    }

    async dance(duration = 100) {  // 跳舞！
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration * 50) {  // 转换为毫秒
            // 随机选择动作
            const action = Math.floor(Math.random() * 3);
            switch(action) {
                case 0:
                    await this.wave(1);
                    break;
                case 1:
                    await this.sneak(10);
                    break;
                case 2:
                    await this.jump(1);
                    break;
            }
            await this.bot.waitForTicks(5);
        }
    }

    async lookAtNearestPlayer() {
        const players = this.bot.players;
        if (Object.keys(players).length === 0) {
            this.bot.chat('你在哪？');
            return;
        }
        const pos = players[Object.keys(players)[0]].entity.position;
        pos.y += 1;
        await this.bot.lookAt(pos);
    }

    async mineBlock(blockType, maxDistance = 4) {
        // 先判断需要使用的工具类型
        const woodTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];
        const needAxe = woodTypes.includes(blockType);
        
        // 根据方块类型装备对应的工具
        if (needAxe) {
            await this.equipAxe();
        } else {
            await this.equipPickaxe();
        }

        const blockID = this.mcData.blocksByName[blockType]?.id
        if (!blockID) {
            this.logger.report('方块类型错误喵：' + blockType, this.bot);
            return false;
        }

        const blocks = this.bot.findBlocks({
            matching: blockID,
            maxDistance: maxDistance,
            count: 1
        })

        if (!blocks || blocks.length === 0) {
            this.logger.report('附近找不到 ' + blockType, this.bot);
            return false;
        }

        const blockPos = blocks[0];
        const block = this.bot.blockAt(blockPos);
        if (!block) return false;

        try {
            const goal = new GoalBlock(blockPos.x, blockPos.y, blockPos.z);
            await this.bot.pathfinder.goto(goal);
            await this.bot.collectBlock.collect(block);
            this.logger.report(`成功挖到一个 ${blockType} 喵！`, this.bot);
            return true;
        } catch (err) {
            this.logger.report('挖掘失败了喵：' + err.message, this.bot);
            return false;
        }
    }

    getItemCount(itemName) {
        const items = this.bot.inventory.items().filter(item => item.name === itemName);
        if (!items.length) return 0;
        return items.reduce((count, item) => count + item.count, 0);
    }

    async craftItemWithoutCraftingTable(itemName, count) {
        const item = this.mcData.itemsByName[itemName];
        if (!item) {
            this.logger.report('找不到物品: ' + itemName, this.bot);
            return;
        }
        const recipe = this.bot.recipesFor(item.id, null, 1, null)[0];
        if (!recipe) {
            this.logger.report('找不到 ' + itemName + ' 的合成配方喵！', this.bot);
            return;
        }

        try {
            let craftedCount = 0;
            while (craftedCount < count) {
                await this.bot.craft(recipe, 1);
                craftedCount += recipe.result.count;
                this.logger.report('已经合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
            }
            
            this.logger.report('!合成完成啦！一共合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
        } catch (err) {
            this.logger.report('合成失败了：' + err.message, this.bot);
        }
    }

    async craftItemWithCraftingTable(itemName, count) {
        const { GoalNear } = require('mineflayer-pathfinder').goals;
        const item = this.mcData.itemsByName[itemName];
        if (!item) {
            this.logger.report('找不到物品: ' + itemName, this.bot);
            return;
        }

        const craftingTable = this.bot.findBlock({
            matching: this.mcData.blocksByName.crafting_table.id,
            maxDistance: 32
        });

        if (!craftingTable) {
            this.logger.report('找不到工作台喵！', this.bot);
            return;
        }

        const recipe = this.bot.recipesFor(item.id, null, 1, craftingTable)[0];
        if (!recipe) {
            this.logger.report('找不到 ' + itemName + ' 的合成配方喵！', this.bot);
            return;
        }

        try {
            // 检查是否已经在工作台附近
            const distanceToTable = this.bot.entity.position.distanceTo(craftingTable.position);
            if (distanceToTable > 3) {  // 只有距离超过3格才需要寻路
                await this.bot.pathfinder.goto(new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 1));
            }
            
            let craftedCount = 0;
            while (craftedCount < count) {
                await this.bot.craft(recipe, 1, craftingTable);
                craftedCount += recipe.result.count;
                this.logger.report('已经合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
                
                if (craftedCount >= count) break;
            }
            
            this.logger.report('合成完成啦！一共合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
        } catch (err) {
            this.logger.report('合成失败了喵：' + err.message, this.bot);
            this.logger.error(err);
        }
    }

    async moveTo(targetBlock, timeout = 60000) {  // 默认30秒超时
        try {
            // 创建移动任务的Promise
            const defaultMove = new Movements(this.bot);
            defaultMove.allow1by1towers = false;
            this.bot.pathfinder.setMovements(defaultMove);
            const movePromise = this.bot.pathfinder.goto(new GoalNear(targetBlock.x, targetBlock.y, targetBlock.z, 1));
            
            // 创建超时Promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    this.bot.pathfinder.stop(); // 停止寻路
                    reject(new Error('移动超时了喵！'));
                }, timeout);
            });

            // 使用Promise.race竞争
            await Promise.race([movePromise, timeoutPromise]);
            this.logger.report('到达目的地: ' + targetBlock.x + ' ' + targetBlock.y + ' ' + targetBlock.z, this.bot);
            return true;
        } catch (err) {
            this.logger.report('移动失败了喵：' + err.message, this.bot);
            return false;
        }
    }


    async findPlaceBlock() {
        // 获取机器人当前位置
        const botPos = this.bot.entity.position;
        
        // 搜索附近的实心方块
        const blocks = this.bot.findBlocks({
            matching: (block) => block.boundingBox === 'block',
            maxDistance: 3,
            count: 256
        });

        // 按照距离排序
        blocks.sort((a, b) => {
            const distA = a.distanceTo(botPos);
            const distB = b.distanceTo(botPos);
            return distA - distB;
        });

        // 遍历找到的方块，检查其上方是否有合适的放置位置
        for (const blockPos of blocks) {
            const block = this.bot.blockAt(blockPos);
            const targetPos = blockPos.offset(0, 1, 0);
            
            // 检查目标位置周围一圈（包括上下）是否都是空的
            let surroundingClear = true;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = 0; dy <= 1; dy++) {  // 只检查同层和上一层
                    for (let dz = -1; dz <= 1; dz++) {
                        // 跳过目标方块位置本身
                        if (dx === 0 && dy === 0 && dz === 0) continue;
                        
                        const checkPos = targetPos.offset(dx, dy, dz);
                        const checkBlock = this.bot.blockAt(checkPos);
                        
                        // 如果周围有非空方块，标记为不可用
                        if (checkBlock && checkBlock.boundingBox !== 'empty') {
                            surroundingClear = false;
                            break;
                        }
                    }
                    if (!surroundingClear) break;
                }
                if (!surroundingClear) break;
            }
            
            // 检查目标位置是否有实体
            const isEntityAtTarget = Object.values(this.bot.entities).some(entity => {
                const entityPos = entity.position;
                return Math.abs(entityPos.x - targetPos.x) < 1 &&
                       Math.abs(entityPos.y - targetPos.y) < 1 &&
                       Math.abs(entityPos.z - targetPos.z) < 1;
            });

            // 检查：
            // 1. 目标位置是空的
            // 2. 机器人可以看到这个方块
            // 3. 目标位置周围一圈都是空的
            // 4. 目标位置附近没有实体
            if ((!this.bot.blockAt(targetPos) || this.bot.blockAt(targetPos).boundingBox === 'empty') && 
                this.bot.canSeeBlock(block) &&
                surroundingClear &&
                !isEntityAtTarget) {
                this.logger.report('找到可放置位置的参考方块: ' + block.position.toString(), this.bot);
                return block;
            }
        }

        this.logger.report('找不到合适的放置位置喵！', this.bot);
        return null;
    }

    async placeBlock(itemName, referenceBlock) {
        const item = this.bot.inventory.findInventoryItem(itemName);
        
        if (!item) {
            this.logger.report('找不到物品: ' + itemName, this.bot);
            return false;
        }

        if (!referenceBlock) {
            this.logger.report('没有提供参考方块喵！', this.bot);
            return false;
        }

        try {
            await this.bot.equip(item, 'hand');
            
            // 创建一个新的 Vec3 实例来指定放置方向
            const faceVector = new Vec3(0, 1, 0);
            await this.bot.placeBlock(referenceBlock, faceVector);
            
            this.logger.report('已放置 ' + itemName, this.bot);
            return true;
        } catch (err) {
            this.logger.report('放置失败: ' + err.message, this.bot);
            this.logger.error(err);
            return false;
        }
    }


    async equipAxe() {
        // 按照工具等级排序
        const axeTypes = ['netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe'];
        
        // 查找背包中最好的斧头
        let bestAxe = null;
        for (const axeType of axeTypes) {
            bestAxe = this.bot.inventory.findInventoryItem(axeType);
            if (bestAxe) break;
        }

        if (!bestAxe) {
            this.logger.report('找不到任何斧头喵~', this.bot);
            return;
        }

        await this.bot.equip(bestAxe, 'hand');
        this.logger.report('装备了 ' + bestAxe.name + ' 喵！', this.bot);
    }


    async equipPickaxe() {
        // 按照工具等级排序
        const pickaxeTypes = ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];
        
        // 查找背包中最好的镐
        let bestPickaxe = null;
        for (const pickType of pickaxeTypes) {
            bestPickaxe = this.bot.inventory.findInventoryItem(pickType);
            if (bestPickaxe) break;
        }

        if (!bestPickaxe) {
            this.logger.report('找不到任何镐子', this.bot);
            return;
        }

        await this.bot.equip(bestPickaxe, 'hand');
        this.logger.report('装备了 ' + bestPickaxe.name, this.bot);
    }

    async returnToGround() {
        await this.equipPickaxe();
        
        // 定义可通过的方块类型
        const passableBlocks = [
            'air',
            'snow',
            'grass',
            'tall_grass',
            'fern',
            'large_fern',
            'dead_bush',
            'dandelion',
            'poppy',
            'blue_orchid',
            'allium',
            'azure_bluet',
            'red_tulip',
            'orange_tulip',
            'white_tulip',
            'pink_tulip',
            'oxeye_daisy',
            'cornflower',
            'lily_of_the_valley'
        ];

        const isAtSurface = () => {
            const pos = this.bot.entity.position
            
            // 检查头顶10格是否通畅
            for (let y = 1; y <= 10; y++) {
                const block = this.bot.blockAt(pos.offset(0, y, 0))
                if (!block || !passableBlocks.includes(block.name)) return false
            }
            
            // 检查周围2格范围是否开阔(检查2层高度)
            for (let y = 0; y <= 1; y++) {
                for (let x = -2; x <= 2; x++) {
                    for (let z = -2; z <= 2; z++) {
                        const block = this.bot.blockAt(pos.offset(x, y, z))
                        if (!block || !passableBlocks.includes(block.name)) return false
                    }
                }
            }
            
            return true
        }

        // 如果已经在地面就直接返回
        if (isAtSurface()) {
            this.logger.report('已经在地面上了！', this.bot)
            return
        }

        this.logger.report('开始寻找返回地面的路径...', this.bot)
        
        // 向上挖掘直到找到地面
        let steps = 0
        const maxSteps = 100 // 防止无限循环
        
        while (!isAtSurface() && steps < maxSteps) {
            const pos = this.bot.entity.position

            // 寻找前方的实心方块
            let targetBlock = null
            for (let i = 1; i <= 3; i++) {
                const checkBlock = this.bot.blockAt(pos.offset(0, 1, i))
                if (checkBlock && checkBlock.boundingBox === 'block') {
                    targetBlock = pos.offset(0, 1, i)
                    break
                }
            }

            // 如果找不到实心方块，就继续向前移动一格
            if (!targetBlock) {
                targetBlock = pos.offset(0, 1, 1)
            }

            // 检查并挖掘通道
            const block1 = this.bot.blockAt(pos.offset(0, 1, 1))
            const block2 = this.bot.blockAt(pos.offset(0, 2, 1))
            const block3 = this.bot.blockAt(pos.offset(0, 2, 0))

            // 挖掉前方上方的两个方块以确保通道
            if (block1 && block1.name !== 'air') {
                await this.bot.dig(block1)
            }
            if (block2 && block2.name !== 'air') {
                await this.bot.dig(block2)
            }

            if (block3 && block3.name !== 'air') {
                await this.bot.dig(block3)
            }

            // 移动到新的位置
            await this.bot.pathfinder.goto(new GoalBlock(targetBlock.x, targetBlock.y, targetBlock.z))
            
            steps++
            if (steps % 5 === 0) {
                this.logger.report(`已经向上挖掘了 ${steps} 格...`, this.bot)
            }
        }

        if (steps >= maxSteps) {
            this.logger.report('无法找到地面，可能距离太远了！', this.bot)
            return
        }

        this.logger.report('成功返回地面！', this.bot)
    }

    
}

module.exports = Action;
