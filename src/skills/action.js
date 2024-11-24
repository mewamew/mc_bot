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
        const entity = players[Object.keys(players)[0]].entity;
        if (entity) {
            const pos = entity.position;
            pos.y += 1;
            await this.bot.lookAt(pos);
        }
    }

    async mineBlock(blockType, maxDistance = 4) {
        // 添加方块到物品的映射关系
        const blockToItemMap = {
            'coal_ore': 'coal',
            'deepslate_coal_ore': 'coal',
            'iron_ore': 'raw_iron',
            'deepslate_iron_ore': 'raw_iron',
            'gold_ore': 'raw_gold',
            'deepslate_gold_ore': 'raw_gold',
            'copper_ore': 'raw_copper',
            'deepslate_copper_ore': 'raw_copper',
            'diamond_ore': 'diamond',
            'deepslate_diamond_ore': 'diamond',
            'emerald_ore': 'emerald',
            'deepslate_emerald_ore': 'emerald',
            'lapis_ore': 'lapis_lazuli',
            'deepslate_lapis_ore': 'lapis_lazuli',
            'redstone_ore': 'redstone',
            'deepslate_redstone_ore': 'redstone',
            'nether_gold_ore': 'gold_nugget',
            'nether_quartz_ore': 'quartz',
            'stone': 'cobblestone'
        };

        // 获取对应的物品名称
        const itemType = blockToItemMap[blockType] || blockType;

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
            count: 64
        })

        if (!blocks || blocks.length === 0) {
            this.logger.report('附近找不到 ' + blockType, this.bot);
            return false;
        }

        // 尝试每个找到的方块
        for (const blockPos of blocks) {
            const block = this.bot.blockAt(blockPos);
            if (!block) continue;

            try {
                // 移动到方块附近
                const success = await this.moveTo(blockPos);
                if (!success) {
                    this.logger.report(`移动到这个${blockType}失败了，试试下一个喵～`, this.bot);
                    continue;  // 尝试下一个方块
                }

                // 记录挖掘前的物品数量
                const beforeCount = this.getItemCount(itemType);
                this.logger.report('到达目标方块附近，开始挖掘', this.bot);
                await this.bot.waitForTicks(10);
                // 使用 dig 方法挖掘
                await this.bot.dig(block);
                
                // 等待一小段时间让物品进入背包
                await this.bot.waitForTicks(20);
                
                // 检查物品数量是否增加
                const afterCount = this.getItemCount(itemType);
                const isSuccess = afterCount > beforeCount;
                
                if (isSuccess) {
                    this.logger.report(`成功挖到一个 ${blockType}，获得了 ${itemType} 喵！`, this.bot);
                } else {
                    this.logger.report(`虽然挖掉了 ${blockType}，但是没有收集到 ${itemType} 呢`, this.bot);
                }
                
                return isSuccess;
            } catch (err) {
                this.logger.report(`这个${blockType}挖掘失败了，试试下一个喵：${err.message}`, this.bot);
                continue;  // 尝试下一个方块
            }
        }

        this.logger.report(`附近的${blockType}都尝试过了，但是都失败了喵...`, this.bot);
        return false;
    }

    getItemCount(itemName) {
        // 添加方块到物品的映射关系
        const blockToItemMap = {
            'coal_ore': 'coal',
            'deepslate_coal_ore': 'coal',
            'iron_ore': 'raw_iron',
            'deepslate_iron_ore': 'raw_iron',
            'gold_ore': 'raw_gold',
            'deepslate_gold_ore': 'raw_gold',
            'copper_ore': 'raw_copper',
            'deepslate_copper_ore': 'raw_copper',
            'diamond_ore': 'diamond',
            'deepslate_diamond_ore': 'diamond',
            'emerald_ore': 'emerald',
            'deepslate_emerald_ore': 'emerald',
            'lapis_ore': 'lapis_lazuli',
            'deepslate_lapis_ore': 'lapis_lazuli',
            'redstone_ore': 'redstone',
            'deepslate_redstone_ore': 'redstone',
            'nether_gold_ore': 'gold_nugget',
            'nether_quartz_ore': 'quartz',
            'stone': 'cobblestone'
        };

        // 获取对应的物品名称
        const actualItemName = blockToItemMap[itemName] || itemName;
        
        const items = this.bot.inventory.items().filter(item => item.name === actualItemName);
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
            
            // 新增：将制作的物品拿在手上并跳跃庆祝
            const craftedItem = this.bot.inventory.findInventoryItem(itemName);
            if (craftedItem) {
                await this.bot.equip(craftedItem, 'hand');
                await this.jump(2);  // 开心地跳两下
            }
        } catch (err) {
            this.logger.report('合成失败了喵：' + err.message, this.bot);
            this.logger.error(err);
        }
    }

    async moveTo(targetPos, timeout = 60000) {  // 默认60秒超时
        try {
            // 创建移动任务的Promise
            const defaultMove = new Movements(this.bot);
            defaultMove.allow1by1towers = false;
            this.bot.pathfinder.setMovements(defaultMove);
            const movePromise = this.bot.pathfinder.goto(new GoalNear(targetPos.x, targetPos.y, targetPos.z, 1));
            
            // 创建超时Promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    this.bot.pathfinder.stop(); // 停止寻路
                    reject(new Error('移动超时了喵！'));
                }, timeout);
            });

            // 使用Promise.race竞争
            await Promise.race([movePromise, timeoutPromise]);
            this.logger.report('到达目的地: ' + targetPos.x + ' ' + targetPos.y + ' ' + targetPos.z, this.bot);
            return true;
        } catch (err) {
            this.logger.report('移动失败了喵：' + err.message, this.bot);
            return false;
        }
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
            // 计算放置位置
            const faceVector = new Vec3(0, 1, 0);
            const placePos = referenceBlock.position.plus(faceVector);
            
            // 检查机器人是否站在即将放置方块的位置上
            const botPos = this.bot.entity.position.floored();
            if (botPos.equals(placePos)) {
                this.logger.report('机器人站在即将放置方块的位置上喵！', this.bot);
                // 向任意一个安全的方向移动一格
                const safePositions = [
                    new Vec3(2, 0, 0),
                    new Vec3(-2, 0, 0),
                    new Vec3(0, 0, 2),
                    new Vec3(0, 0, -2)
                ];

                for (const offset of safePositions) {
                    const newPos = botPos.plus(offset);
                    const blockAtNewPos = this.bot.blockAt(newPos);
                    if (blockAtNewPos && blockAtNewPos.name === 'air') {
                        await this.moveTo(newPos);
                        break;
                    }
                }
            }

            await this.bot.equip(item, 'hand');
            await this.bot.placeBlock(referenceBlock, faceVector);
            
            this.logger.report('已放置 ' + itemName, this.bot);
            return true;
        } catch (err) {
            this.logger.report('放置失败了喵: ' + err.message, this.bot);
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
            const axe = this.bot.inventory.findInventoryItem(axeType);
            if (axe && axe.type && this.mcData.items[axe.type].name === axeType) {
                bestAxe = axe;
                break;
            }
        }

        if (!bestAxe) {
            this.logger.report('找不到任何斧头喵~', this.bot);
            return;
        }

        try {
            await this.bot.equip(bestAxe, 'hand');
            // 验证是否成功装备
            const heldItem = this.bot.inventory.slots[this.bot.getEquipmentDestSlot('hand')];
            if (!heldItem || !axeTypes.includes(heldItem.name)) {
                this.logger.report('装备斧头失败了喵！手里拿着的是：' + (heldItem ? heldItem.name : '空'), this.bot);
                return;
            }
            this.logger.report('成功装备了 ' + bestAxe.name + ' 喵！', this.bot);
        } catch (err) {
            this.logger.report('装备斧头时出错了喵：' + err.message, this.bot);
        }
    }


    async equipPickaxe() {
        // 按照工具等级排序
        const pickaxeTypes = ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];
        
        // 查找背包中最好的镐
        let bestPickaxe = null;
        for (const pickType of pickaxeTypes) {
            const pickaxe = this.bot.inventory.findInventoryItem(pickType);
            if (pickaxe && pickaxe.type && this.mcData.items[pickaxe.type].name === pickType) {
                bestPickaxe = pickaxe;
                break;
            }
        }

        if (!bestPickaxe) {
            this.logger.report('找不到任何镐子喵~', this.bot);
            return;
        }

        try {
            await this.bot.equip(bestPickaxe, 'hand');
            // 验证是否成功装备
            const heldItem = this.bot.inventory.slots[this.bot.getEquipmentDestSlot('hand')];
            if (!heldItem || !pickaxeTypes.includes(heldItem.name)) {
                this.logger.report('装备镐子失败了喵！手里拿着的是：' + (heldItem ? heldItem.name : '空'), this.bot);
                return;
            }
            this.logger.report('成功装备了 ' + bestPickaxe.name + ' 喵！', this.bot);
        } catch (err) {
            this.logger.report('装备镐子时出错了喵：' + err.message, this.bot);
        }
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

    async meltItem(itemToSmelt, itemCount, fuelName, fuelCount) {
        const furnace = this.bot.findBlock({
            matching: this.mcData.blocksByName.furnace.id,
            maxDistance: 32
        });

        if (!furnace) {
            this.logger.report('找不到熔炉喵！', this.bot);
            return false;
        }

        try {
            // 移动到熔炉附近
            const distanceToFurnace = this.bot.entity.position.distanceTo(furnace.position);
            if (distanceToFurnace > 3) {
                await this.moveTo(furnace.position);
            }

            // 打开熔炉
            const furnaceBlock = await this.bot.openFurnace(furnace);

            // 查找燃料
            const fuel = this.bot.inventory.findInventoryItem(fuelName);
            if (!fuel) {
                this.logger.report(`找不到燃料喵！需要 ${fuelName}`, this.bot);
                furnaceBlock.close();
                return false;
            }

            // 查找要冶炼的物品
            const itemToSmeltInv = this.bot.inventory.findInventoryItem(itemToSmelt);
            if (!itemToSmeltInv) {
                this.logger.report(`找不到要冶炼的物品：${itemToSmelt}`, this.bot);
                furnaceBlock.close();
                return false;
            }

            // 检查物品和燃料数量是否足够
            if (itemToSmeltInv.count < itemCount) {
                this.logger.report(`物品数量不足喵！只有 ${itemToSmeltInv.count} 个 ${itemToSmelt}`, this.bot);
                furnaceBlock.close();
                return false;
            }

            if (fuel.count < fuelCount) {
                this.logger.report(`燃料数量不足喵！只有 ${fuel.count} 个 ${fuelName}`, this.bot);
                furnaceBlock.close();
                return false;
            }

            // 放入燃料和物品
            await furnaceBlock.putFuel(fuel.type, null, fuelCount);
            await furnaceBlock.putInput(itemToSmeltInv.type, null, itemCount);

            this.logger.report(`放入了 ${fuelCount} 个 ${fuelName}，开始冶炼 ${itemCount} 个 ${itemToSmelt} 喵~`, this.bot);

            // 等待冶炼完成
            let smeltedCount = 0;
            while (smeltedCount < itemCount) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 每秒检查一次
                const output = furnaceBlock.outputItem();
                if (output) {
                    smeltedCount = output.count;
                    this.logger.report(`已经冶炼了 ${smeltedCount}/${itemCount} 个物品喵~`, this.bot);
                }
            }

            // 取出产物
            await furnaceBlock.takeOutput();
            furnaceBlock.close();
            
            this.logger.report(`冶炼完成啦！成功冶炼了 ${itemCount} 个 ${itemToSmelt}`, this.bot);
            return true;

        } catch (err) {
            this.logger.report('冶炼失败了喵：' + err.message, this.bot);
            return false;
        }
    }

}

module.exports = Action;
